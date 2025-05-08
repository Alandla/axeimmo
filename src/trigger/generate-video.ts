import { logger, metadata, task, wait } from "@trigger.dev/sdk";
import { Steps } from "../types/step";
import { Voice } from "../types/voice";
import { AvatarLook } from "../types/avatar";
import { createAudioTTS } from "../lib/elevenlabs";
import { uploadToS3Audio } from "../lib/r2";
import { transitions, sounds } from "../config/transitions.config";
import { ITransition, ISequence } from "../types/video";

import transcriptionMock from "../test/mockup/transcriptionComplete.json";
import keywordsMock from "../test/mockup/keywordsResponse.json";
import sequencesWithMediaMock from "../test/mockup/sequencesWithMedia.json";
import sentencesMock from "../test/mockup/sentences.json";
import sentencesNoTranscriptionMock from "../test/mockup/sentencesNoTranscription.json";
import sentencesWithNewTranscriptionMock from "../test/mockup/sentencesWithNewTranscription.json";

import { createLightTranscription, getTranscription, ISentence, splitSentences } from "../lib/transcription";
import { calculateElevenLabsCost } from "../lib/cost";
import { mediaToMediaSpace, searchMediaForKeywords } from "../service/media.service";
import { IMedia, IVideo } from "../types/video";
import { createVideo, updateVideo } from "../dao/videoDao";
import { generateStartData } from "../lib/ai";
import { subtitles } from "../config/subtitles.config";
import { getJobCost, SieveCostResponse } from "../lib/sieve";
import { simplifyMediaFromPexels, simplifySequences } from "../lib/analyse";
import { music } from "../config/musics.config";
import { Genre } from "../types/music";
import { addMediasToSpace, updateSpaceLastUsed, getSpaceById } from "../dao/spaceDao";
import { IMediaSpace, ISpace } from "../types/space";
import { addVideoCountContact, sendCreatedVideoEvent } from "../lib/loops";
import { getMostFrequentString } from "../lib/utils";
import { MixpanelEvent } from "../types/events";
import { track } from "../utils/mixpanel-server";
import { videoScriptKeywordExtractionRun, generateVideoDescription, selectBRollsForSequences, selectBRollDisplayModes, analyzeVideoSequence, matchMediaWithSequences, mediaRecommendationFilterRun } from "../lib/workflowai";
import { analyzeImage } from "../lib/ai";
import { PlanName } from "../types/enums";

import { extractFramesFromVideo } from "../lib/ffmpeg";

interface GenerateVideoPayload {
  spaceId: string
  userId: string
  files: IMedia[]
  script: string
  voice: Voice
  avatar: AvatarLook
  mediaSource: string
}

export const generateVideoTask = task({
  id: "generate-video",
  machine: {
    preset: "medium-1x"
  },
  maxDuration: 600, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: GenerateVideoPayload, { ctx }) => {

    let cost = 0
    const mediaSource = payload.mediaSource || "PEXELS";
    const avatarFile = payload.files.find(f => f.usage === 'avatar')

    const isDevelopment = ctx.environment.type === "DEVELOPMENT"

    let videoStyle: string | undefined;
    let spacePlan: string = PlanName.FREE;
    let scriptLength = payload.script ? payload.script.length : 0;

    logger.log("Generating video...", { payload, ctx });

    let video : IVideo = {
      spaceId: payload.spaceId,
      state: {
        type: 'generating',
      },
      runId: ctx.run.id,
      history: [{
        step: 'CREATE',
        user: payload.userId,
        date: new Date()
      }]
    }

    let newVideo = await createVideo(video)

    /*
    /
    /   Analyze user medias in parallel
    /
    */
    let userMediaAnalysisPromise: Promise<IMediaSpace[]> | null = null;
    let analyzedMedias: IMediaSpace[] = [];
    
    if (payload.files.some(file => file.usage === 'media')) {
      logger.log(`[ANALYZE] Starting user media analysis in parallel...`);
      
      // Commencer l'analyse des médias utilisateur en parallèle
      const userMediaAnalysis = async () => {
        const mediasToAnalyze = payload.files.filter(file => file.usage === 'media');
        const analyzedMedias: IMediaSpace[] = [];
        
        // Analyser tous les médias en parallèle
        const mediaAnalysisPromises = mediasToAnalyze.map(async (media) => {
          try {
            let descriptions: [{ start: number, duration?: number, text: string }] | undefined;
            
            if (media.type === 'video' && media.video?.link) {
              // Extraire les frames de la vidéo
              logger.log(`[ANALYZE] Extracting frames from video: ${media.video.link}`);
              const frames = await extractFramesFromVideo(media.video.link);
              
              // Analyser les frames avec WorkflowAI
              logger.log(`[ANALYZE] Analyzing video frames with WorkflowAI`);
              const { sequences: videoSequences, cost: sequenceCost } = await analyzeVideoSequence(frames);
              cost += sequenceCost;
              
              // Convertir les séquences en descriptions
              descriptions = videoSequences
                .filter(seq => seq.description) // On garde uniquement les séquences avec une description
                .map(seq => ({
                  start: seq.start_timestamp || 0,
                  duration: seq.duration,
                  text: seq.description || ""
                })) as [{ start: number, duration?: number, text: string }];
              
            } else if (media.type === 'image' && media.image?.link) {
              // Analyser l'image avec Groq
              logger.log(`[ANALYZE] Analyzing image with Groq: ${media.image.link}`);
              const analysis = await analyzeImage(media.image.link);
              
              if (analysis) {
                descriptions = [{
                  start: 0,
                  text: analysis.description
                }];
              }
            }
            
            if (descriptions) {
              return mediaToMediaSpace([{
                ...media,
                description: descriptions
              }], payload.userId)[0];
            }
            
            return null;
          } catch (error) {
            logger.error(`[ANALYZE] Error analyzing media:`, {
              mediaId: media.id,
              error: error instanceof Error ? error.message : String(error)
            });
            return null;
          }
        });
        
        // Attendre que toutes les analyses soient terminées et filtrer les résultats null
        const results = await Promise.all(mediaAnalysisPromises);
        const validResults = results.filter(result => result !== null) as IMediaSpace[];
        
        // Ajouter les résultats valides à analyzedMedias
        analyzedMedias.push(...validResults);

        if (analyzedMedias.length > 0) {
          logger.log(`[ANALYZE] Adding analyzed medias to space`);
          await addMediasToSpace(payload.spaceId, analyzedMedias);
        }
        
        return analyzedMedias;
      };
      
      logger.log(`[ANALYZE] User media analysis started in background`);

      userMediaAnalysisPromise = userMediaAnalysis();
    }

    // Initialiser un objet pour stocker la promesse de génération des mots-clés
    let keywordsPromise: Promise<any> | null = null
    let keywords: any;
    
    /*
    /
    /   Get Space and filter media if PRO/ENTREPRISE
    /
    */
    let userMediasFilteredPromise: Promise<IMediaSpace[]> | null = null;
    let userMediasFiltered: IMediaSpace[] = [];
    
    // Récupérer les informations du space pour connaître le plan
    logger.log(`[MEDIA] Getting space information for media filtering...`);
    const getSpaceAndFilterMedias = async (videoScript: string) => {
      try {
        // Récupérer les informations sur le space
        const space = await getSpaceById(payload.spaceId);
        
        if (!space) {
          logger.error(`[MEDIA] Space not found: ${payload.spaceId}`);
          return [];
        }

        spacePlan = space.plan?.name;
        if (space.plan && (space.plan.name === PlanName.PRO || space.plan.name === PlanName.ENTREPRISE)) {

          if (videoScript && space.medias && space.medias.length > 0) {
            const availableMedias = space.medias
              .filter((mediaSpace: IMediaSpace) => 
                mediaSpace.autoPlacement !== false && 
                mediaSpace.media.description && 
                mediaSpace.media.description.length > 0 &&
                mediaSpace.media.description.some((desc: {text: string}) => desc.text)
              )
              .map((mediaSpace: IMediaSpace, index: number) => ({
                id: mediaSpace.media.id || String(index),
                descriptions: mediaSpace.media.description?.map((desc: {text: string}) => desc.text) || []
              }));
            
            if (availableMedias.length > 0) {
              logger.log(`[MEDIA] Filtering ${availableMedias.length} medias with WorkflowAI`);
              
              const { recommendedMedia, cost: filterCost } = await mediaRecommendationFilterRun(
                videoScript, 
                availableMedias
              );
              
              cost += filterCost;
              logger.log(`[MEDIA] Filtering cost: $${filterCost}`);

              if (recommendedMedia.length > 0) {
                const filteredMedias = space.medias.filter((mediaSpace: IMediaSpace) => 
                  recommendedMedia.includes(mediaSpace.media.id || "")
                );
                
                logger.log(`[MEDIA] Found ${filteredMedias.length} matching medias from ${recommendedMedia.length} recommended IDs`);
                return filteredMedias;
              } else {
                logger.log(`[MEDIA] No media IDs recommended by WorkflowAI`);
              }
            } else {
              logger.log(`[MEDIA] No media with descriptions found for filtering`);
            }
          } else {
            logger.log(`[MEDIA] No script or medias available for filtering`);
          }
        } else {
          logger.log(`[MEDIA] Plan ${space.plan?.name} doesn't support media filtering`);
        }
        
        return [];
      } catch (error) {
        logger.error(`[MEDIA] Error filtering medias:`, {
          error: error instanceof Error ? error.message : String(error)
        });
        return [];
      }
    };
    
    // Lancer la promesse de filtrage des médias en parallèle si on a déjà un script
    if (payload.script) {
      userMediasFilteredPromise = getSpaceAndFilterMedias(payload.script);
      logger.log(`[MEDIA] Media filtering process started in background with provided script`);
    }

    if (payload.script) {
      const startData = generateStartData(payload.script).then((data) => {
        videoStyle = data?.details.style
        newVideo = {
          title: data?.details.title,
          style: data?.details.style,
          isNews: data?.details.news,
          ...newVideo,
        }

        updateVideo(newVideo)

        return data?.details
      })

      /*
      /
      /   Generate keywords
      /
      */

      logger.log(`[KEYWORDS] Starting keyword generation in parallel...`)

      if (isDevelopment) {
        keywordsPromise = Promise.resolve(keywordsMock)
      } else {
        // Lancer la génération des mots-clés en parallèle
        keywordsPromise = videoScriptKeywordExtractionRun(payload.script).then(resultKeywords => {
          keywords = resultKeywords?.output?.keywords || []
          cost += resultKeywords?.cost || 0

          logger.log('[KEYWORDS] Result', { keywords: resultKeywords?.output?.keywords || [] })
          logger.log('[KEYWORDS] Cost', { cost: resultKeywords?.cost || 0 })
          return keywords
        })

        logger.log(`[KEYWORDS] Keyword generation started in background`)
      }
    }

    /*
    /
    /   Get voice
    /
    */
    const voiceFile: IMedia | undefined = payload.files?.find(file => file.usage === "voice");

    logger.log(`[VOICE] Start voice generation...`)
    let sentences: ISentence[] = [];

    if (isDevelopment) {
      await metadata.replace({
        name: Steps.VOICE_GENERATION,
        progress: 0
      })

      sentences = sentencesWithNewTranscriptionMock

      await metadata.replace({
        name: Steps.VOICE_GENERATION,
        progress: 100
      })

    } else if (voiceFile) {
      logger.log(`[VOICE] Voice file already uploaded`)
      logger.info('Voice file', { voiceFile })
      sentences.push({
        index: 0,
        audioUrl: voiceFile.audio?.link || "",
      })
    } else if (!avatarFile) {
      logger.log(`[VOICE] Generate voice with elevenlabs...`)

      await metadata.replace({
        name: Steps.VOICE_GENERATION,
        progress: 0
      })

      const sentencesCut = payload.script
        .replace(/\.\.\./g, '___ELLIPSIS___') // Remplace temporary points of ellipsis
        .split(/(?<=[.!?])\s+(?=[A-Z])/g)
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0);

      // Restore ellipsis
      const processedSentencesCut = sentencesCut.map(sentence => 
        sentence.replace(/___ELLIPSIS___/g, '...')
      );
      
      const rawSentences = [];
      
      for (let i = 0; i < processedSentencesCut.length; i++) {
        const currentSentence = processedSentencesCut[i].trim();
        
        // Check if it's the last sentence
        if (i === processedSentencesCut.length - 1) {
          rawSentences.push(currentSentence);
          continue;
        }
        
        // Count the words of the next sentence
        const nextSentence = processedSentencesCut[i + 1].trim();
        const nextSentenceWordCount = nextSentence.split(/\s+/).length;
        
        if (nextSentenceWordCount < 4) {
          // Combine with the next sentence
          rawSentences.push(currentSentence + ' ' + nextSentence);
          i++; // Skip the next sentence
        } else {
          rawSentences.push(currentSentence);
        }
      }
      let processedCount = 0;

      // Process sentences by batches of 5
      for (let i = 0; i < rawSentences.length; i += 15) {
        const batch = rawSentences.slice(i, Math.min(i + 15, rawSentences.length));
        
        const batchPromises = batch.map(async (text, batchIndex) => {
          const globalIndex = i + batchIndex; // Global index to maintain order
          try {
            const audioBuffer = await createAudioTTS(
              payload.voice.id,
              text.trim(),
              payload.voice.voiceSettings,
              true
            );
            
            // Upload directly after generation
            const audioUrl = await uploadToS3Audio(audioBuffer, 'medias-users');


            processedCount++
            await metadata.replace({
              name: Steps.VOICE_GENERATION,
              progress: Math.round((processedCount / rawSentences.length) * 100)
            });
            
            return {
              index: globalIndex,
              text: text.trim(),
              audioUrl
            };
          } catch (error: any) {
            if (error.response?.status === 422) {
              await wait.for({ seconds: 2 });

              const retryBuffer = await createAudioTTS(
                payload.voice.id,
                text.trim(),
                payload.voice.voiceSettings,
                true
              );

              const audioUrl = await uploadToS3Audio(retryBuffer, 'medias-users');

              processedCount++
              await metadata.replace({
                name: Steps.VOICE_GENERATION,
                progress: Math.round((processedCount / rawSentences.length) * 100)
              });

              return {
                index: globalIndex,
                text: text.trim(),
                audioUrl
              };
            }
            throw error;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        sentences.push(...batchResults);
      }

      // Trier les phrases par index
      sentences.sort((a, b) => a.index - b.index);

      cost += calculateElevenLabsCost(payload.script, true);
      
    } else if (avatarFile) {
      sentences.push({
        index: 0,
        audioUrl: avatarFile.video?.link || "",
      })
    }

    await metadata.replace({
      name: Steps.VOICE_GENERATION,
      progress: 100
    });

    logger.log(`[VOICE] Voice generation done`)

    logger.info('Sentences', { sentences })

    /*
    /
    /   Get transcription
    /
    */
    logger.log(`[TRANSCRIPTION] Start transcription...`)

    await metadata.replace({
      name: Steps.TRANSCRIPTION,
      progress: 0
    })

    if (!isDevelopment) {
      try {
        const totalSentences = sentences.length;
        let transcribedCount = 0;
        let transcriptionCost = 0;
        const transcriptionPromises = sentences.map(async (sentence, index) => {
          try {
            const transcriptionResult = await getTranscription(sentence.audioUrl, sentence.text);
            
            if (!transcriptionResult) {
              return sentence;
            }
            
            transcribedCount++;

            await metadata.replace({
              name: Steps.TRANSCRIPTION,
              progress: Math.round((transcribedCount / totalSentences) * 100)
            });
            
            logger.info(`Transcription ${index + 1}/${totalSentences} completed`, { transcriptionResult });

            transcriptionCost += transcriptionResult.cost;

            
            const words = transcriptionResult.raw.words;
            
            return {
              ...sentence,
              transcription: {
                text: transcriptionResult.text,
                language: transcriptionResult.raw.language,
                start: words.length > 0 ? words[0].start : 0,
                end: words.length > 0 ? words[words.length - 1].end : 0,
                words: words
              }
            };
          } catch (error) {
            logger.error(`Error transcribing sentence ${index}:`, { errorMessage: error instanceof Error ? error.message : String(error) });
            return sentence;
          }
        });

        sentences = await Promise.all(transcriptionPromises);
        cost += transcriptionCost;
        
        logger.info(`All sentences transcribed`, { totalCount: sentences.length, cost: transcriptionCost });
      } catch (error) {
        logger.error('Error in transcription process', { errorMessage: error instanceof Error ? error.message : String(error) });
      }
    }

    await metadata.replace({
      name: Steps.TRANSCRIPTION,
      progress: 100
    })

    logger.log(`[TRANSCRIPTION] Transcription done`)

    /*
    /
    /   Clean transcription to get 2-3sec sequence separate and adjust words timing
    /   Get Light JSON to send to AI and reduce cost
    /
    */

    logger.info('Sentences with transcription', { sentences })

    let { sequences, videoMetadata } = splitSentences(sentences);
    const lightTranscription = createLightTranscription(sequences);
    const voices = extractVoiceSegments(sequences, sentences, payload.voice ? payload.voice.id : undefined);

    logger.info('Sequences', { sequences })
    logger.info('Light transcription', { lightTranscription })
    logger.info('Voices', { voices })
    
    // Si pas de script en entrée, générer les mots-clés à partir du script transcrit
    if (!payload.script && !keywordsPromise) {
      const script = lightTranscription.map(item => item.text).join(' ');
      scriptLength = script.length;
      const startData = generateStartData(script).then((data) => {
        logger.info('Start data', data?.details)
        videoStyle = data?.details.style
        newVideo = {
          title: data?.details.title,
          style: data?.details.style,
          isNews: data?.details.news,
          ...newVideo,
        }

        updateVideo(newVideo)

        return data?.details
      })

      // Générer les mots-clés maintenant que nous avons le script transcrit
      logger.log(`[KEYWORDS] Starting keyword generation from transcription...`)

      if (isDevelopment) {
        keywordsPromise = Promise.resolve(keywordsMock)
      } else {
        keywordsPromise = videoScriptKeywordExtractionRun(script).then(resultKeywords => {
          keywords = resultKeywords?.output?.keywords || []
          cost += resultKeywords?.cost || 0

          logger.log('[KEYWORDS] Result', { keywords: resultKeywords?.output?.keywords || [] })
          logger.log('[KEYWORDS] Cost', { cost: resultKeywords?.cost || 0 })
          return keywords
        })

        logger.log(`[KEYWORDS] Keyword generation from transcription started`)
      }
      
      // Lancer le filtrage des médias si nous n'avions pas de script au départ
      if (!userMediasFilteredPromise) {
        userMediasFilteredPromise = getSpaceAndFilterMedias(script);
      }
    }
    
    /*
    /
    /   Attendre que les mots-clés soient générés
    /
    */

    await metadata.replace({
      name: Steps.SEARCH_MEDIA,
      progress: 0,
    });

    if (keywordsPromise) {
      logger.log(`[KEYWORDS] Waiting for keywords to complete...`)
      keywords = await keywordsPromise
      logger.log(`[KEYWORDS] Keywords generation completed`)
    }

    /*
    /
    /   Search media for sequences
    /
    */

    logger.log(`[MEDIA] Search media...`);

    let mediaResults = []

    if (isDevelopment) {
      sequences = sequencesWithMediaMock as ISequence[]
    } else {

      let mediaCount = 6;
      
      // Si plus de 2000 caractères, on ajoute 5 mots-clés
      if (scriptLength > 2000) {
        mediaCount += 4;
      }

      mediaResults = await searchMediaForKeywords(keywords, mediaSource, mediaCount);

      logger.log(`[MEDIA] Media search completed with ${mediaResults.length} medias for ${Array.from(new Set(mediaResults.map(r => r.keyword))).length} unique keywords`);
      
      await metadata.replace({
        name: Steps.SEARCH_MEDIA,
        progress: 100,
      });

      /*
      /
      /   Analyze media from stock with WorkflowAI
      /
      */
      
      if (mediaResults.length > 0) {
        logger.log(`[ANALYZE] Starting media analysis with WorkflowAI...`);
        
        await metadata.replace({
          name: Steps.ANALYZE_FOUND_MEDIA,
          progress: 0
        });
        
        // Pour suivre le coût total de l'analyse
        let costForAnalysis = 0;
        let completedAnalyses = 0;
        const totalMedias = mediaResults.length;
        
        // Préparer les promesses d'analyse pour tous les médias en parallèle
        const analysisPromises = mediaResults.map(async (mediaResult, index) => {
          try {
            const media = mediaResult.media;
            
            // Si c'est une vidéo et qu'elle a des images de prévisualisation
            if (media.type === 'video' && media.video_pictures && media.video_pictures.length >= 4) {
              // Extraire 4 images de preview de la vidéo
              const videoPreviewUrls = media.video_pictures.slice(0, 4).map((pic: { link?: string, picture?: string }) => pic.link || pic.picture);
              
              // Générer la description avec WorkflowAI
              const { description, cost } = await generateVideoDescription(videoPreviewUrls);
              
              // Mettre à jour le coût total
              costForAnalysis += cost;
              
              // Mettre à jour le média avec la description
              if (description) {
                // Ajouter la description au média
                mediaResult.media = {
                  ...media,
                  description: [{
                    start: 0,
                    text: description
                  }]
                };
                
                logger.log(`[ANALYZE] Description generated for media ${index + 1}`, { 
                  mediaId: media.video?.id,
                  description: description.substring(0, 100) + '...'
                });
              }

              await metadata.replace({
                name: Steps.ANALYZE_FOUND_MEDIA,
                progress: Math.round((completedAnalyses / totalMedias) * 100)
              });

            } else {
              logger.info(`[ANALYZE] Skipping media ${index + 1} (not a video or insufficient preview images)`, {
                mediaId: media.video?.id || media.image?.id,
                type: media.type
              });
            }
            
            // Mettre à jour le compteur et la progression
            completedAnalyses++;
            
            return mediaResult;
          } catch (error) {
            logger.error(`[ANALYZE] Error analyzing media ${index + 1}`, {
              mediaId: mediaResult.media.video?.id || mediaResult.media.image?.id,
              error: error instanceof Error ? error.message : String(error)
            });
            
            // Mettre à jour le compteur et la progression même en cas d'erreur
            completedAnalyses++;
            
            return mediaResult;
          }
        });
        
        // Attendre que toutes les analyses soient terminées
        await Promise.all(analysisPromises);
        
        // Ajouter le coût de l'analyse au coût total
        cost += costForAnalysis;
        
        logger.log(`[ANALYZE] Media analysis completed for ${completedAnalyses}/${totalMedias} medias`);
        logger.info(`[ANALYZE] Cost for media analysis: $${costForAnalysis}`);
        
        await metadata.replace({
          name: Steps.ANALYZE_FOUND_MEDIA,
          progress: 100
        });
      }
    }

    /*
    /
    /   Attendre que les médias utilisateur soient analysés
    /
    */

    if (userMediaAnalysisPromise) {
      await metadata.replace({
        name: Steps.ANALYZE_YOUR_MEDIA,
        progress: 0,
      });

      logger.log(`[ANALYZE] Waiting for user media analysis to complete...`)
      analyzedMedias = await userMediaAnalysisPromise;
      logger.log(`[ANALYZE] User media analysis completed`, { count: analyzedMedias.length });

      await metadata.replace({
        name: Steps.ANALYZE_YOUR_MEDIA,
        progress: 100,
      });
    }

    /*
    /
    /   Attendre que le filtrage des médias soit terminé
    /
    */
    if (userMediasFilteredPromise && (spacePlan === PlanName.PRO || spacePlan === PlanName.ENTREPRISE)) {
      logger.log(`[MEDIA] Waiting for media filtering to complete...`);
      userMediasFiltered = await userMediasFilteredPromise;
      logger.log(`[MEDIA] Media filtering completed with ${userMediasFiltered.length} filtered medias`, { userMediasFiltered });
    }

    let simplifiedMedia = [];
    try {
      simplifiedMedia = simplifyMediaFromPexels(mediaResults)
    } catch (error) {
      logger.log(`[MEDIA] Media results`, { mediaResults })
      logger.error(`[BROLL] Error simplifying media:`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    logger.info('Simplified media', { simplifiedMedia })
    const inputAnalyse = {
      sequence_list: lightTranscription,
      b_roll_list: simplifiedMedia
    }

    // Utiliser l'IA pour sélectionner les meilleurs B-Rolls pour chaque séquence et matcher les médias analysés
    logger.log(`[BROLL] Selecting best B-Rolls and matching media for sequences...`)

    await metadata.replace({
      name: Steps.PLACE_BROLL,
      progress: 0
    });

    try {
      // Préparer les données pour les deux appels
      const sequencesForMatching = lightTranscription.map((seq, idx) => ({
        id: String(seq.id),
        transcript: seq.text
      }));

      // Préparer les médias analysés pour le matching
      const analyzedMediasForMatching = analyzedMedias.map((media, idx) => ({
        id: String(idx),
        descriptions: media.media.description?.map(d => d.text) || [],
        needed: true // Ces médias sont nécessaires
      }));

      // Préparer les médias filtrés et les combiner avec ceux analysés
      let combinedMedias = [...analyzedMediasForMatching];
      
      // Ajouter les médias filtrés avec needed = false
      if (userMediasFiltered.length > 0) {
        const filteredMediasForMatching = userMediasFiltered.map((media, idx) => ({
          id: String(analyzedMedias.length + idx), // On continue la numérotation
          descriptions: media.media.description?.map(d => d.text) || [],
          needed: false // Ces médias sont optionnels
        }));
        
        combinedMedias = [...combinedMedias, ...filteredMediasForMatching];
      }

      // Lancer selectBRollsForSequences et optionnellement matchMediaWithSequences
      let brollResult: { selections: { sequence_id?: string, media_id?: string }[], cost: number };
      let matchResult: { matches: { sequence_id?: string, media_id?: string, description_index?: number }[], cost: number } | undefined;
      
      if (combinedMedias.length > 0) {
        // Si on a des médias analysés ou filtrés, lancer les deux appels en parallèle
        [brollResult, matchResult] = await Promise.all([
          selectBRollsForSequences(simplifiedMedia, sequencesForMatching, keywords),
          matchMediaWithSequences(combinedMedias, sequencesForMatching)
        ]);
        cost += brollResult.cost + matchResult.cost;
      } else {
        // Sinon, lancer uniquement selectBRollsForSequences
        brollResult = await selectBRollsForSequences(simplifiedMedia, sequencesForMatching, keywords);
        cost += brollResult.cost;
      }

      logger.log(`[BROLL] B-Roll and media matching completed`, { 
        totalBRollSelections: brollResult.selections.length,
        totalMediaMatches: matchResult?.matches?.length || 0,
        totalCost: brollResult.cost + (matchResult?.cost || 0)
      });

      // Appliquer les médias sélectionnés aux séquences
      sequences = sequences.map((sequence, sequenceIndex) => {
        // Trouver la sélection correspondante à cette séquence
        const brollSelection = brollResult.selections.find(s => Number(s.sequence_id) === sequenceIndex);
        const mediaMatch = matchResult?.matches?.find(m => Number(m.sequence_id) === sequenceIndex);
        
        let updatedSequence = { ...sequence };

        // Appliquer le média correspondant s'il existe
        if (mediaMatch) {
          const mediaId = Number(mediaMatch.media_id);
          // Déterminer si le média provient des analyzedMedias ou des userMediasFiltered
          const isFromAnalyzedMedias = mediaId < analyzedMedias.length;
          
          if (isFromAnalyzedMedias) {
            // Média provenant de analyzedMedias (needed = true)
            const matchedMedia = analyzedMedias[mediaId];
            if (matchedMedia && matchedMedia.media.description && mediaMatch.description_index !== undefined) {
              updatedSequence.media = {
                ...matchedMedia.media,
                startAt: matchedMedia.media.description[mediaMatch.description_index].start,
                description: matchedMedia.media.description,
              };
            }
          } else {
            // Média provenant de userMediasFiltered (needed = false)
            const filteredMediaIndex = mediaId - analyzedMedias.length;
            if (filteredMediaIndex >= 0 && filteredMediaIndex < userMediasFiltered.length) {
              const matchedMedia = userMediasFiltered[filteredMediaIndex];
              if (matchedMedia && matchedMedia.media.description && mediaMatch.description_index !== undefined) {
                const startAt = matchedMedia.media.description[mediaMatch.description_index].start;
                const plainMedia = JSON.parse(JSON.stringify(matchedMedia.media));
                updatedSequence.media = {
                  ...plainMedia,
                  startAt: startAt,
                  description: matchedMedia.media.description,
                };
              }
            }
          }
        } else if (brollSelection) {
          // Trouver le média correspondant dans mediaResults
          const selectedMedia = mediaResults[Number(brollSelection.media_id)];
          
          if (selectedMedia) {
            updatedSequence.media = selectedMedia.media;
          }
        }
        
        return updatedSequence;
      });

      await metadata.replace({
        name: Steps.PLACE_BROLL,
        progress: 100
      });

      logger.log(`[BROLL] Media applied to sequences`);

      // Si on a un avatar, on détermine comment afficher les B-rolls
      if (payload.avatar || avatarFile) {
        logger.log(`[BROLL] Determining B-roll display modes with avatar...`);

        await metadata.replace({
          name: Steps.DISPLAY_BROLL,
          progress: 0
        });
        
        try {
          const sequencesForDisplay = simplifySequences(sequences)
          
          const { displayModes, cost: displayModeCost } = await selectBRollDisplayModes(sequencesForDisplay);
          cost += displayModeCost;
          
          logger.info(`[BROLL] Display modes selected`, { displayModes });
          
          sequences = sequences.map((sequence, index) => {
            const displayMode = displayModes.find((mode: { sequence_id?: string, display_mode?: "full" | "half" | "hide" }) => 
              Number(mode.sequence_id) === index
            );
            
            if (displayMode && sequence.media) {
              return {
                ...sequence,
                media: {
                  ...sequence.media,
                  show: displayMode.display_mode
                }
              };
            }
            
            return sequence;
          });

          await metadata.replace({
            name: Steps.DISPLAY_BROLL,
            progress: 100
          });
          
          logger.log(`[BROLL] Display modes applied to sequences`);
        } catch (error) {
          logger.error(`[BROLL] Error selecting display modes:`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    } catch (error) {
      logger.error(`[BROLL] Error selecting B-Rolls:`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    await metadata.replace({
      name: Steps.REDIRECTING,
      progress: 20
    });

    logger.info('Sequences', { sequences })

    let avatar;
    if (avatarFile) {
      avatar = {
        videoUrl: avatarFile.video?.link || ""
      }
    } else if (payload.avatar) {
      avatar = payload.avatar
    }

    let videoMusic;
    if (videoStyle) {
      let style = videoStyle as Genre
      const matchingMusics = music.filter((m: any) => m.genre === style)
      videoMusic = matchingMusics[Math.floor(Math.random() * matchingMusics.length)]
    }

    // Ajouter les transitions automatiques
    const burntFilmTransitions = transitions.filter((t: ITransition) => t.category === "Burnt Film");
    const transitionSoundIndexes = [14, 15, 18, 19, 27, 31, 47];
    const transitionSounds = sounds.filter((_: any, index: number) => transitionSoundIndexes.includes(index));

    const lastSequencesOfAudio = new Map<number, number>();
    sequences.forEach((seq: ISequence, index: number) => {
      if (seq.audioIndex !== undefined) {
        lastSequencesOfAudio.set(seq.audioIndex, index);
      }
    });

    // Delete last element because we don't want to add a transition at the end of the video
    const maxAudioIndex = Math.max(...Array.from(lastSequencesOfAudio.keys()));
    lastSequencesOfAudio.delete(maxAudioIndex);

    // Créer les transitions
    const autoTransitions = Array.from(lastSequencesOfAudio.entries()).map(([_, sequenceIndex]) => {
      const randomTransition = burntFilmTransitions[Math.floor(Math.random() * burntFilmTransitions.length)];
      const randomSound = transitionSounds[Math.floor(Math.random() * transitionSounds.length)];

      return {
        indexSequenceBefore: sequenceIndex,
        durationInFrames: randomTransition.durationInFrames || 0,
        video: randomTransition.video,
        thumbnail: randomTransition.thumbnail,
        sound: randomSound.url,
        volume: 0.15,
        fullAt: randomTransition.fullAt || 0,
        category: randomTransition.category,
        mode: randomTransition.mode
      };
    });

    const space : ISpace | undefined = await updateSpaceLastUsed(payload.spaceId, payload.voice ? payload.voice.id : undefined, payload.avatar ? payload.avatar.id : "999")

    let subtitle = subtitles[1]
    if (space && space.lastUsed?.subtitles) {
      const mostFrequent = getMostFrequentString(space.lastUsed.subtitles)
      if (mostFrequent) {
        const subtitleFind = subtitles.find((subtitle) => subtitle.name === mostFrequent);
        if (subtitleFind) {
          subtitle = subtitleFind;
        } else {
          const subtitleFindFromSpace = space.subtitleStyle.find((subtitle) => subtitle.name === mostFrequent);
          if (subtitleFindFromSpace) {
            subtitle = subtitleFindFromSpace;
          }
        }
      }
    }

    newVideo = {
      ...newVideo,
      costToGenerate: cost + ctx.run.baseCostInCents,
      state: {
        type: 'done',
      },
      video: {
        audio: {
          voices: voices,
          volume: 1,
          music: videoMusic ? {
            url: videoMusic.url,
            volume: 0.07,
            name: videoMusic.name,
            genre: videoMusic.genre
          } : undefined
        },
        keywords: keywords,
        transitions: autoTransitions,
        thumbnail: "",
        metadata: videoMetadata,
        sequences,
        avatar,
        subtitle: {
          name: subtitle.name,
          style: subtitle.style,
        }
      }
    }

    // Add time to the end of the video to ensure a smooth transition
    if (newVideo.video && newVideo.video.sequences.length > 0) {
      // Add 0.5 second to the last sequence
      const lastSequenceIndex = newVideo.video.sequences.length - 1;
      const lastSequence = newVideo.video.sequences[lastSequenceIndex];
      lastSequence.end += 0.5;
      
      // Add 0.5 second to the last word of the last sequence
      if (lastSequence.words && lastSequence.words.length > 0) {
        const lastWordIndex = lastSequence.words.length - 1;
        lastSequence.words[lastWordIndex].end += 0.5;
        lastSequence.words[lastWordIndex].durationInFrames = (lastSequence.words[lastWordIndex].durationInFrames || 0) + 30;
      }
      
      // Add 30 frames to the duration in frames of the last sequence
      lastSequence.durationInFrames = (lastSequence.durationInFrames || 0) + 30;
      
      // Add 0.5 second to the total video duration
      if (newVideo.video.metadata) {
        newVideo.video.metadata.audio_duration = (newVideo.video.metadata.audio_duration || 0) + 0.5;
      }
      
      // Add 0.5 second to the last audio
      if (newVideo.video.audio && newVideo.video.audio.voices && newVideo.video.audio.voices.length > 0) {
        const lastVoiceIndex = newVideo.video.audio.voices.length - 1;
        const lastVoice = newVideo.video.audio.voices[lastVoiceIndex];
        lastVoice.end = (lastVoice.end || 0) + 0.5;
        lastVoice.durationInFrames = (lastVoice.durationInFrames || 0) + 30;
      }
    }

    newVideo = await updateVideo(newVideo)

    const user = await addVideoCountContact(payload.userId)

    if (user && user.videosCount === 0) {
      await sendCreatedVideoEvent({ email: user.email, videoId: newVideo.id || "" })
      track(MixpanelEvent.FIRST_VIDEO_CREATED, {
        distinct_id: payload.userId,
        videoId: newVideo.id,
        hasAvatar: payload.avatar ? true : false,
      })
    }

    return {
      videoId: newVideo.id,
    }
  },
});

function extractVoiceSegments(sequences: ISequence[], sentences: ISentence[], voiceId?: string): {
  index: number;
  url: string;
  start: number;
  end: number;
  durationInFrames: number;
  voiceId?: string;
}[] {
  const voiceSegments = new Map<number, {
    start: number;
    end: number;
    durationInFrames: number;
    sequences: ISequence[];
    voiceId?: string;
  }>();

  // Grouper les séquences par audioIndex
  sequences.forEach(sequence => {
    if (!voiceSegments.has(sequence.audioIndex)) {
      voiceSegments.set(sequence.audioIndex, {
        start: sequence.start,
        end: sequence.end,
        durationInFrames: sequence.durationInFrames || 0,
        sequences: [sequence],
        voiceId: voiceId || undefined
      });
    } else {
      const current = voiceSegments.get(sequence.audioIndex)!;
      current.end = sequence.end;
      current.durationInFrames += sequence.durationInFrames || 0;
      current.sequences.push(sequence);
      current.voiceId = voiceId || undefined
    }
  });

  // Convertir en tableau avec tous les segments
  const result = Array.from(voiceSegments.entries()).map(([index, data]) => ({
    index,
    url: sentences[index].audioUrl,
    start: data.start,
    end: data.end,
    durationInFrames: data.durationInFrames,
    voiceId
  }));

  // Si aucun résultat, retourner au moins un segment par défaut
  return result.length > 0 ? result : [{
    index: 0,
    url: '',
    start: 0,
    end: 0,
    durationInFrames: 0,
    voiceId
  }];
} 