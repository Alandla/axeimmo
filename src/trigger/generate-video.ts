import { logger, metadata, task, wait } from "@trigger.dev/sdk";
import { Steps } from "../types/step";
import { Voice } from "../types/voice";
import { AvatarLook } from "../types/avatar";
import { createTextToSpeech } from "../lib/tts";
import { transitions, sounds } from "../config/transitions.config";
import { ITransition, ISequence, ZoomType } from "../types/video";
import { analyzeVideo, VideoAnalysisResult } from "../lib/video-analysis";

import transcriptionMock from "../test/mockup/transcriptionComplete.json";
import keywordsMock from "../test/mockup/keywordsResponse.json";
import sequencesWithMediaMock from "../test/mockup/sequencesWithMedia.json";
import sentencesMock from "../test/mockup/sentences.json";
import sentencesNoTranscriptionMock from "../test/mockup/sentencesNoTranscription.json";
import sentencesWithNewTranscriptionMock from "../test/mockup/sentencesWithNewTranscription.json";

import { createLightTranscription, getTranscription, ISentence, splitSentences, createZoomInputFromRawSequences } from "../lib/transcription";
import { mediaToMediaSpace, searchMediaForKeywords, searchGoogleImagesForQueries } from "../service/media.service";
import { IMedia, IVideo } from "../types/video";
import { createVideo, updateVideo } from "../dao/videoDao";
import { generateStartData, extractImageSource } from "../lib/ai";
import { subtitles } from "../config/subtitles.config";
import { simplifyMediaFromPexels, simplifySequences, simplifyGoogleMedias } from "../lib/analyse";
import { music } from "../config/musics.config";
import { Genre } from "../types/music";
import { addMediasToSpace, updateSpaceLastUsed, getSpaceById, removeCreditsToSpace, incrementImageToVideoUsage } from "../dao/spaceDao";
import { IMediaSpace, ISpace } from "../types/space";
import { addVideoCountContact, sendCreatedVideoEvent } from "../lib/loops";
import { getMostFrequentString } from "../lib/utils";
import { MixpanelEvent } from "../types/events";
import { track } from "../utils/mixpanel-server";
import { videoScriptKeywordExtractionRun, generateVideoDescription, selectBRollsForSequences, selectBRollDisplayModes, matchMediaWithSequences, mediaRecommendationFilterRun, videoScriptImageSearchRun, imageAnalysisRun, videoZoomInsertionRun, textVoiceEnhancementRun } from "../lib/workflowai";
import { generateKlingAnimation } from "../service/kling-animation.service";
import { PlanName } from "../types/enums";
import { checkKlingRequestStatus, getKlingRequestResult, KlingGenerationMode } from "../lib/fal";
import { KLING_GENERATION_COSTS } from "../lib/cost";
import { calculateGenerationCredits } from "../lib/video-estimation";

interface GenerateVideoPayload {
  spaceId: string
  userId: string
  files: IMedia[]
  script: string
  voice: Voice
  avatar: AvatarLook
  mediaSource: string
  webSearch: boolean
  animateImages: boolean
  animationMode: KlingGenerationMode
  emotionEnhancement: boolean
  format?: 'vertical' | 'square' | 'ads' // Format optionnel pour la vidéo
  webhookUrl?: string
  useSpaceMedia?: boolean // Par défaut true - utiliser les médias du space
  saveMediaToSpace?: boolean // Par défaut true - sauvegarder les médias dans le space
  deductCredits?: boolean // Par défaut false - déduire les crédits du space (true pour API, false pour application)
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
    let extractedMedias: IMedia[] = [];

    const isDevelopment = ctx.environment.type === "DEVELOPMENT"

    let videoStyle: string | undefined;
    let spacePlan: string = PlanName.FREE;
    let scriptLength = payload.script ? payload.script.length : 0;

    logger.log("Generating video...", { payload, ctx });

    /*
    /
    /   Get Space information at the beginning
    /
    */
    logger.log(`[SPACE] Getting space information...`);
    const space = await getSpaceById(payload.spaceId);
    
    if (!space) {
      throw new Error(`Space not found: ${payload.spaceId}`);
    }

    spacePlan = space.plan?.name || PlanName.FREE;
    logger.log(`[SPACE] Space plan: ${spacePlan}, Credits: ${space.credits || 0}`);

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
        
        // Séparer les vidéos et les images
        const videoMedias = mediasToAnalyze.filter(media => media.type === 'video');
        const imageMedias = mediasToAnalyze.filter(media => media.type === 'image');
        
        // Lancer l'analyse des vidéos et des images en parallèle
        const [videoResults, imageResults] = await Promise.all([
          // Analyser les vidéos par batches de 7 maximum
          processBatches(
            videoMedias,
            async (media) => {
              try {
                if (media.video?.link) {
                  // Utiliser la nouvelle méthode analyzeVideo
                  logger.log(`[ANALYZE] Analyzing video with analyzeVideo method: ${media.video.link}`);
                  const analysisResult = await analyzeVideo(media.video.link, media.id);
                  cost += analysisResult.cost;
                  
                  // Les descriptions sont déjà au bon format
                  const descriptions = analysisResult.descriptions as [{ start: number, duration?: number, text: string }];
                  
                  // Ajouter les frames et durationInSeconds au média
                  const updatedMedia = {
                    ...media,
                    video: {
                      ...media.video,
                      frames: analysisResult.frames,
                      durationInSeconds: analysisResult.durationInSeconds
                    }
                  };
                  
                  return mediaToMediaSpace([{
                    ...updatedMedia,
                    description: descriptions
                  }], payload.userId)[0];
                }
                
                return null;
              } catch (error) {
                logger.error(`[ANALYZE] Error analyzing video:`, {
                  mediaId: media.id,
                  error: error instanceof Error ? error.message : String(error)
                });
                return null;
              }
            },
            7 // Limite de 7 analyses vidéo en parallèle
          ),
          
          // Analyser toutes les images en parallèle (sans limite)
          Promise.all(
            imageMedias.map(async (media) => {
              try {
                if (media.image?.link) {
                  // Analyser l'image avec WorkflowAI
                  logger.log(`[ANALYZE] Analyzing image with WorkflowAI: ${media.image.link}`);
                  const { description: imageDescription, cost: imageCost } = await imageAnalysisRun(media.image.link);
                  cost += imageCost;

                  if (imageDescription) {
                    const descriptions = [{
                      start: 0,
                      text: imageDescription
                    }] as [{ start: number, duration?: number, text: string }];
                    
                    return mediaToMediaSpace([{
                      ...media,
                      description: descriptions
                    }], payload.userId)[0];
                  }
                }
                
                return null;
              } catch (error) {
                logger.error(`[ANALYZE] Error analyzing image:`, {
                  mediaId: media.id,
                  error: error instanceof Error ? error.message : String(error)
                });
                return null;
              }
            })
          )
        ]);
        
        // Combiner les résultats et filtrer les null
        const allResults = [...videoResults, ...imageResults];
        const validResults = allResults.filter(result => result !== null) as IMediaSpace[];
        
        // Ajouter les résultats valides à analyzedMedias
        analyzedMedias.push(...validResults);

        // Filter out medias with "extracted" source before adding to space
        const mediasToAddToSpace = analyzedMedias.filter(mediaSpace => 
          mediaSpace.media.source !== 'extracted'
        );

        // Keep extracted medias to add them to the video
        extractedMedias = analyzedMedias.filter(mediaSpace => 
          mediaSpace.media.source === 'extracted'
        ).map(mediaSpace => mediaSpace.media);

        if (mediasToAddToSpace.length > 0 && payload.saveMediaToSpace !== false) {
          logger.log(`[ANALYZE] Adding ${mediasToAddToSpace.length} analyzed medias to space (excluding ${analyzedMedias.length - mediasToAddToSpace.length} extracted images)`);
          await addMediasToSpace(payload.spaceId, mediasToAddToSpace);
        } else if (payload.saveMediaToSpace === false) {
          logger.log(`[ANALYZE] Skipping adding medias to space (saveMediaToSpace=false)`);
        }
        
        return analyzedMedias;
      };
      
      logger.log(`[ANALYZE] User media analysis started in background`);

      userMediaAnalysisPromise = userMediaAnalysis();
    }
    
    // Méthode complète pour la recherche et l'analyse d'images Google
    let googleImagesSearchPromise: Promise<IMedia[]> | null = null;
    let googleImagesResults: IMedia[] = [];

    const searchAndAnalyzeGoogleImages = async (script: string) => {
      try {
        logger.log(`[GOOGLE_IMAGES] Starting Google Images workflow`);
        
        const { queries, cost: queriesCost } = await videoScriptImageSearchRun(script);
        cost += queriesCost;
        
        if (!queries || queries.length === 0) {
          logger.log(`[GOOGLE_IMAGES] No queries generated, aborting Google Images search`);
          return [];
        }
        
        logger.log(`[GOOGLE_IMAGES] Generated ${queries.length} search queries with cost $${queriesCost}`);
        
        // Étape 2: Rechercher les images avec les requêtes générées
        logger.log(`[GOOGLE_IMAGES] Searching Google Images for ${queries.length} queries...`);
        const searchResults = await searchGoogleImagesForQueries(queries, 5);
        
        if (searchResults.length === 0) {
          logger.log(`[GOOGLE_IMAGES] No images found from Google, aborting`);
          return [];
        }
        
        logger.log(`[GOOGLE_IMAGES] Found ${searchResults.length} images from Google`, { searchResults });
        
        // Étape 3: Analyser les images trouvées
        logger.log(`[GOOGLE_IMAGES] Analyzing Google Images...`);
        
        const analyzedMedias: IMedia[] = [];
        
        // Analyser toutes les images en parallèle
        const analysisPromises = searchResults.map(async (result) => {
          try {
            const media = result.media;
            
            if (media.type === 'image' && media.image?.link) {
              // Analyser l'image avec WorkflowAI
              logger.log(`[GOOGLE_IMAGES] Analyzing image with WorkflowAI: ${media.image.link}`);
              const { description: imageDescription, cost: imageCost } = await imageAnalysisRun(media.image.link);
              cost += imageCost;
              logger.log(`[GOOGLE_IMAGES] Analysis result:`, { imageDescription });
              
              if (imageDescription) {
                const mediaWithDescription = {
                  ...media,
                  description: [{
                    start: 0,
                    text: imageDescription
                  }] as [{ start: number, duration?: number, text: string }]
                };
                
                return mediaWithDescription;
              }
            }
            
            return null;
          } catch (error) {
            logger.error(`[GOOGLE_IMAGES] Error analyzing image:`, {
              mediaId: result.media.id,
              error: error instanceof Error ? error.message : String(error)
            });
            return null;
          }
        });
        
        // Attendre que toutes les analyses soient terminées et filtrer les résultats null
        const results = await Promise.all(analysisPromises);
        const validResults = results.filter(result => result !== null) as IMedia[];
        
        // Ajouter les résultats valides
        analyzedMedias.push(...validResults);
        
        return analyzedMedias;
      } catch (error) {
        logger.error(`[GOOGLE_IMAGES] Error in Google Images workflow:`, {
          error: error instanceof Error ? error.message : String(error)
        });
        return [];
      }
    };

    // Lancer la recherche d'images Google en parallèle si on a un script et webSearch est activé
    // mais seulement si on n'a pas de médias extracted
    const hasExtractedMedia = payload.files.some(file => file.source === 'extracted');
    if (payload.script && payload.webSearch && !hasExtractedMedia) {
      logger.log(`[GOOGLE_IMAGES] Starting Google Images search in parallel with provided script`);
      googleImagesSearchPromise = searchAndAnalyzeGoogleImages(payload.script);
    } else if (hasExtractedMedia) {
      logger.log(`[GOOGLE_IMAGES] Skipping Google Images search - extracted media already available`);
    }

    /*
    /
    /   Get Space and filter media if PRO/ENTREPRISE
    /
    */
    let userMediasFilteredPromise: Promise<IMediaSpace[]> | null = null;
    let userMediasFiltered: IMediaSpace[] = [];
    
    // Filtrer les médias si PRO/ENTREPRISE
    logger.log(`[MEDIA] Filtering media for ${spacePlan} plan...`);
    const filterSpaceMedias = async (videoScript: string, spaceData: ISpace) => {
      try {
        if (spaceData.plan && (spaceData.plan.name === PlanName.PRO || spaceData.plan.name === PlanName.ENTREPRISE)) {

          if (videoScript && spaceData.medias && spaceData.medias.length > 0) {
            const availableMedias = spaceData.medias
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
                const filteredMedias = spaceData.medias.filter((mediaSpace: IMediaSpace) => 
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
          logger.log(`[MEDIA] Plan ${spaceData.plan?.name} doesn't support media filtering`);
        }
        
        return [];
      } catch (error) {
        logger.error(`[MEDIA] Error filtering medias:`, {
          error: error instanceof Error ? error.message : String(error)
        });
        return [];
      }
    };
    
    // Lancer la promesse de filtrage des médias en parallèle si on a déjà un script et si useSpaceMedia n'est pas false
    if (payload.script && payload.useSpaceMedia !== false) {
      userMediasFilteredPromise = filterSpaceMedias(payload.script, space);
      logger.log(`[MEDIA] Media filtering process started in background with provided script`);
    } else if (payload.useSpaceMedia === false) {
      logger.log(`[MEDIA] Skipping space media filtering (useSpaceMedia=false)`);
    }

    // Initialiser un objet pour stocker la promesse de génération des mots-clés
    let keywordsPromise: Promise<any> | null = null
    let keywords: any;

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
      logger.log(`[VOICE] Generate voice...`)

      await metadata.replace({
        name: Steps.VOICE_GENERATION,
        progress: 0
      })

      // Remove emojis before processing sentences to avoid interference with sentence splitting
      const removeEmojis = (text: string): string => {
        // Remove common emoji ranges and symbols
        return text
          .replace(/[\u2600-\u26FF]/g, '') // Miscellaneous Symbols
          .replace(/[\u2700-\u27BF]/g, '') // Dingbats
          .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '') // Surrogate pairs (emojis)
          .replace(/[\u2194-\u2199\u21A9-\u21AA]/g, '') // Arrows
          .replace(/[\u231A-\u231B\u23E9-\u23EC\u23F0\u23F3]/g, '') // Clock and media symbols
          .replace(/[\u25FD-\u25FE]/g, '') // Squares
          .replace(/[\u2B50\u2B55]/g, '') // Stars and circles
          .replace(/✅/g, '') // Check mark
          .replace(/💬/g, ''); // Speech balloon
      };

      let processedScript = removeEmojis(payload.script);
      let enhancedScript = processedScript; // Keep a copy for TTS generation

      // Apply emotion enhancement if enabled and voice is ElevenLabs
      if (payload.emotionEnhancement && payload.voice.mode !== 'minimax') {
        logger.log(`[EMOTION] Starting emotion enhancement for script...`);
        
        try {
          const { enhancements, cost: enhancementCost } = await textVoiceEnhancementRun(processedScript);
          cost += enhancementCost;
          
          logger.log(`[EMOTION] Enhancement completed with ${enhancements.length} modifications`, { 
            cost: enhancementCost,
            enhancements: enhancements.slice(0, 5) // Log first 5 for debug
          });

          // Apply enhancements to the enhanced script copy
          if (enhancements.length > 0) {
            enhancedScript = applyVoiceEnhancements(processedScript, enhancements);
            logger.log(`[EMOTION] Script enhanced successfully`, { enhancedScript });
          }
        } catch (error) {
          logger.error(`[EMOTION] Error enhancing script:`, {
            error: error instanceof Error ? error.message : String(error)
          });
          // Continue with original script if enhancement fails
        }
      }

      // Helper function to split and process script into sentences
      const splitScriptIntoSentences = (script: string): string[] => {
        return script
          .replace(/\.\.\./g, '___ELLIPSIS___') // Temporarily replace ellipsis
          .split(/(?<=[.!?])\s+(?=[A-Z])/g)
          .map(sentence => sentence.trim())
          .filter(sentence => sentence.length > 0)
          .map(sentence => sentence.replace(/___ELLIPSIS___/g, '...')); // Restore ellipsis
      };

      // Split both scripts using the same logic
      const processedSentencesCut = splitScriptIntoSentences(processedScript);
      const enhancedSentencesCut = splitScriptIntoSentences(enhancedScript);
      
      // Helper function to create sentence chunks with both original and enhanced versions
      const createSentenceChunks = (
        originalSentences: string[], 
        enhancedSentences: string[], 
        useEnhancement: boolean
      ): { text: string, textEnhanced?: string }[] => {
        const chunks: { text: string, textEnhanced?: string }[] = [];
        const MIN_CHARS_ENHANCEMENT = 250;
        
        if (useEnhancement) {
          // Enhanced chunking: combine until we reach 250+ characters
          let currentOriginal = '';
          let currentEnhanced = '';
          
          for (let i = 0; i < originalSentences.length; i++) {
            const originalSentence = originalSentences[i].trim();
            const enhancedSentence = enhancedSentences[i]?.trim() || originalSentence;
            
            currentOriginal = currentOriginal ? `${currentOriginal} ${originalSentence}` : originalSentence;
            currentEnhanced = currentEnhanced ? `${currentEnhanced} ${enhancedSentence}` : enhancedSentence;
            
            if (currentOriginal.length >= MIN_CHARS_ENHANCEMENT || i === originalSentences.length - 1) {
              chunks.push({ text: currentOriginal, textEnhanced: currentEnhanced });
              currentOriginal = '';
              currentEnhanced = '';
            }
          }
        } else {
          // Original logic: combine short sentences
          for (let i = 0; i < originalSentences.length; i++) {
            const currentSentence = originalSentences[i].trim();
            
            if (i === originalSentences.length - 1) {
              chunks.push({ text: currentSentence });
              continue;
            }
            
            const nextSentence = originalSentences[i + 1].trim();
            const nextSentenceWordCount = nextSentence.split(/\s+/).length;
            
            if (nextSentenceWordCount < 4) {
              chunks.push({ text: `${currentSentence} ${nextSentence}` });
              i++; // Skip next sentence
            } else {
              chunks.push({ text: currentSentence });
            }
          }
        }
        
        return chunks;
      };

      // Use emotion enhancement chunking logic if emotion enhancement is enabled for ElevenLabs voices
      const useVoiceEnhancement = payload.emotionEnhancement && payload.voice.mode !== 'minimax';
      const rawSentences = createSentenceChunks(processedSentencesCut, enhancedSentencesCut, useVoiceEnhancement);

      logger.log('Raw sentences', { rawSentences })

      let processedCount = 0;

      // Process sentences by batches of 5
      for (let i = 0; i < rawSentences.length; i += 15) {
        const batch = rawSentences.slice(i, Math.min(i + 15, rawSentences.length));
        
        const batchPromises = batch.map(async (sentenceObj, batchIndex) => {
          const globalIndex = i + batchIndex; // Global index to maintain order
          try {
            // Use enhanced text for TTS if available, otherwise use original
            const textForTTS = useVoiceEnhancement && sentenceObj.textEnhanced ? sentenceObj.textEnhanced : sentenceObj.text;
            
            const audioResult = await createTextToSpeech(
              payload.voice,
              textForTTS.trim(),
              true,
              undefined,
              undefined,
              useVoiceEnhancement
            );
            
            // Add cost to total
            cost += audioResult.cost;

            processedCount++
            await metadata.replace({
              name: Steps.VOICE_GENERATION,
              progress: Math.round((processedCount / rawSentences.length) * 100)
            });
            
            return {
              index: globalIndex,
              text: sentenceObj.text.trim(), // Original text for transcription
              audioUrl: audioResult.audioUrl
            };
          } catch (error: any) {
            if (error.response?.status === 422) {
              await wait.for({ seconds: 2 });
              const textForTTS = useVoiceEnhancement && sentenceObj.textEnhanced ? sentenceObj.textEnhanced : sentenceObj.text;

              const retryResult = await createTextToSpeech(
                payload.voice,
                textForTTS.trim(),
                true,
                undefined,
                undefined,
                useVoiceEnhancement
              );
              
              // Add cost to total
              cost += retryResult.cost;

              processedCount++
              await metadata.replace({
                name: Steps.VOICE_GENERATION,
                progress: Math.round((processedCount / rawSentences.length) * 100)
              });

              return {
                index: globalIndex,
                text: sentenceObj.text.trim(), // Original text for transcription
                audioUrl: retryResult.audioUrl
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

    let { sequences, rawSequences, videoMetadata } = splitSentences(sentences);
    const lightTranscription = createLightTranscription(sequences);
    const voices = extractVoiceSegments(sequences, sentences, payload.voice ? payload.voice.id : undefined, payload.emotionEnhancement);

    logger.info('Sequences', { sequences })
    logger.info('Light transcription', { lightTranscription })
    logger.info('Voices', { voices })
    
    /*
    /
    /   Generate zoom recommendations in parallel
    /
    
    logger.log(`[ZOOM] Starting zoom insertion analysis in parallel...`);
    
    const zoomInputSequences = createZoomInputFromRawSequences(rawSequences);
    
    // Lancer l'analyse des zooms en parallèle si on a des séquences
    let zoomPromise: Promise<{ cost: number, zooms: any[] }> | null = null;
    if (zoomInputSequences.length > 0 && !isDevelopment) {
      zoomPromise = videoZoomInsertionRun(zoomInputSequences);
      logger.log(`[ZOOM] Zoom insertion analysis started in background`);
    }
    */
    
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
      
      /* Lancer l'analyse des zooms si on ne l'avait pas fait avant (pas de script initial)
      if (!zoomPromise && zoomInputSequences.length > 0 && !isDevelopment) {
        zoomPromise = videoZoomInsertionRun(zoomInputSequences);
        logger.log(`[ZOOM] Zoom insertion analysis started with transcribed content`);
      }
      */
      
      /* Lancer l'analyse des zooms si on ne l'avait pas fait avant (pas de script initial)
      if (!zoomPromise && zoomInputSequences.length > 0 && !isDevelopment) {
        zoomPromise = videoZoomInsertionRun(zoomInputSequences);
        logger.log(`[ZOOM] Zoom insertion analysis started with transcribed content`);
      }
      */
      
      // Lancer le filtrage des médias si nous n'avions pas de script au départ et si useSpaceMedia n'est pas false
      if (!userMediasFilteredPromise  && payload.useSpaceMedia !== false) {
        userMediasFilteredPromise = filterSpaceMedias(script, space);
      }

      // Lancer la recherche d'images Google si nous n'avions pas de script au départ
      // mais seulement si on n'a pas de médias extracted
      if (payload.webSearch && !googleImagesSearchPromise && !hasExtractedMedia) {
        logger.log(`[GOOGLE_IMAGES] Starting Google Images search with transcribed script`);
        googleImagesSearchPromise = searchAndAnalyzeGoogleImages(script);
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

    /*
    /
    /   Attendre que les images Google soient recherchées
    /
    */

    if (googleImagesSearchPromise) {
      await metadata.replace({
        name: Steps.SEARCH_GOOGLE_IMAGES,
        progress: 0,
      });

      logger.log(`[GOOGLE_IMAGES] Waiting for Google Images search to complete...`)
      googleImagesResults = await googleImagesSearchPromise
      logger.log(`[GOOGLE_IMAGES] Google Images search completed with ${googleImagesResults.length} images`, { googleImagesResults })

      await metadata.replace({
        name: Steps.SEARCH_GOOGLE_IMAGES,
        progress: 100,
      });
    }

    /*
    /
    /   Preparer les resultats de recherche pour l'IA 
    /
    */
    let simplifiedMedia = [];
    try {
      simplifiedMedia = simplifyMediaFromPexels(mediaResults);

      if (googleImagesResults && googleImagesResults.length > 0) {
        logger.log(`[MEDIA] Adding ${googleImagesResults.length} Google Images to simplified media`);
          
        const simplifiedGoogleImages = simplifyGoogleMedias(googleImagesResults, simplifiedMedia.length);
        
        simplifiedMedia = [...simplifiedMedia, ...simplifiedGoogleImages];
      }

      logger.log(`[MEDIA] Total simplified media: ${simplifiedMedia.length}`, { simplifiedMedia });
    } catch (error) {
      logger.log(`[MEDIA] Media results`, { mediaResults, googleImagesResults })
      logger.error(`[BROLL] Error simplifying media:`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
    }

    logger.info('Simplified media', { simplifiedMedia })

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

      const sequencesNeedingSource: number[] = [];

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
          // Déterminer si le média sélectionné provient des médias de stock ou des images Google
          const brollMediaId = Number(brollSelection.media_id);
          const totalStockMedias = mediaResults.length;
          
          if (brollMediaId < totalStockMedias) {
            // Média provenant des résultats de stock (Pexels/Storyblocks)
            const selectedMedia = mediaResults[brollMediaId];
            
            if (selectedMedia) {
              updatedSequence.media = selectedMedia.media;
              logger.log(`[BROLL] Applying stock media ${brollMediaId} to sequence ${sequenceIndex}`);
            }
          } else {
            // Média provenant des images Google
            const googleMediaIndex = brollMediaId - totalStockMedias;
            
            if (googleImagesResults && googleMediaIndex < googleImagesResults.length) {
              const selectedGoogleMedia = googleImagesResults[googleMediaIndex];
              
              if (selectedGoogleMedia) {
                updatedSequence.media = selectedGoogleMedia;
                // Add this sequence to the list needing source extraction
                sequencesNeedingSource.push(sequenceIndex);
                logger.log(`[BROLL] Applying Google image ${googleMediaIndex} to sequence ${sequenceIndex}`);
              }
            }
          }
        }
        
        return updatedSequence;
      });

      if (sequencesNeedingSource.length > 0) {
        logger.log(`[SOURCE] Extracting sources for ${sequencesNeedingSource.length} Google images in parallel...`);
        
        const sourceExtractionPromises = sequencesNeedingSource.map(async (sequenceIndex) => {
          try {
            const sequence = sequences[sequenceIndex];
            if (sequence.media && sequence.media.type === 'image' && sequence.media.image?.link) {
              const source = await extractImageSource(sequence.media.image.link);
              if (source) {
                sequences[sequenceIndex] = {
                  ...sequence,
                  media: {
                    ...sequence.media,
                    source: source
                  }
                };
                logger.log(`[SOURCE] Source "${source}" extracted for sequence ${sequenceIndex}`);
              }
            }
          } catch (error) {
            logger.error(`[SOURCE] Error extracting source for sequence ${sequenceIndex}:`, {
              error: error instanceof Error ? error.message : String(error)
            });
          }
        });

        await Promise.all(sourceExtractionPromises);
        logger.log(`[SOURCE] Source extraction completed for all Google images`);
      }

      await metadata.replace({
        name: Steps.PLACE_BROLL,
        progress: 100
      });

      logger.log(`[BROLL] Media applied to sequences`);

      /*
      /
      /   Animate extracted images if requested
      /
      */
      
      if (payload.animateImages && sequences.some(seq => seq.media?.source === 'extracted')) {
        logger.log(`[ANIMATE] Starting image animation process...`);

        await metadata.replace({
          name: Steps.ANIMATE_IMAGES,
          progress: 0
        });

        // Find sequences with extracted images
        let sequencesToAnimate = sequences
          .map((seq, index) => ({ seq, index }))
          .filter(({ seq }) => seq.media?.type === 'image' && seq.media?.source === 'extracted');

        // Check credits before animation
        if (sequencesToAnimate.length > 0) {
          const creditsPerAnimation = KLING_GENERATION_COSTS[payload.animationMode];
          const totalCreditsNeeded = sequencesToAnimate.length * creditsPerAnimation;
          const availableCredits = space.credits || 0;

          logger.log(`[ANIMATE] Credits check: need ${totalCreditsNeeded}, available ${availableCredits}`);

          if (availableCredits < totalCreditsNeeded) {
            const maxAnimations = Math.floor(availableCredits / creditsPerAnimation);
            logger.log(`[ANIMATE] Not enough credits for all animations. Can only animate ${maxAnimations} out of ${sequencesToAnimate.length} images`);
            
            if (maxAnimations > 0) {
              // Keep only the first maxAnimations sequences
              sequencesToAnimate = sequencesToAnimate.slice(0, maxAnimations);
              logger.log(`[ANIMATE] Limited to ${sequencesToAnimate.length} animations due to credit constraints`);
            } else {
              logger.log(`[ANIMATE] No credits available for animation, skipping all animations`);
              sequencesToAnimate = [];
            }
          }
        }
          

        if (sequencesToAnimate.length > 0) {
          logger.log(`[ANIMATE] Found ${sequencesToAnimate.length} images to animate`);

          // Create animation requests for all extracted images
          const animationRequests = await Promise.all(
            sequencesToAnimate.map(async ({ seq, index }) => {
              try {
                if (!seq.media?.image?.link) {
                  throw new Error('Image URL not found');
                }

                // Generate animation with Kling service
                const animationResult = await generateKlingAnimation({
                  imageUrl: seq.media.image.link,
                  context: 'Add camera movement',
                  imageWidth: seq.media.image.width || 1920,
                  imageHeight: seq.media.image.height || 1080,
                  duration: "5",
                  mode: payload.animationMode,
                  upscale: true
                });

                // Add animation cost to total cost
                cost += animationResult.cost;

                return {
                  sequenceIndex: index,
                  requestId: animationResult.request_id,
                  originalMedia: seq.media
                };
              } catch (error) {
                logger.error(`[ANIMATE] Error starting animation for sequence ${index}:`, {
                  error: error instanceof Error ? error.message : String(error)
                });
                return null;
              }
            })
          );

          // Filter out failed requests
          const validRequests = animationRequests.filter(req => req !== null);

          if (validRequests.length > 0) {
            logger.log(`[ANIMATE] Started ${validRequests.length} animation requests`);

            // Wait for all animations to complete
            let completedAnimations = 0;
            
            // Track all requests and their status
            const pendingRequests = new Map(validRequests.map(req => [req.requestId, req]));
            const completedResults = new Map();
            const analysisQueue: { requestId: string; animationResult: any }[] = [];
            const analysisPromises = new Map(); // Track ongoing analyses
            const maxConcurrentAnalyses = 7;
            let runningAnalyses = 0;

            // Function to start analysis with concurrency limit
            const startAnalysisIfPossible = () => {
              if (runningAnalyses < maxConcurrentAnalyses && analysisQueue.length > 0) {
                const { requestId, animationResult } = analysisQueue.shift()!;
                runningAnalyses++;

                logger.log(`[ANIMATE] Starting analysis for sequence ${animationResult.sequenceIndex} (${runningAnalyses}/${maxConcurrentAnalyses} running)`);
                
                const analysisPromise = analyzeVideo(animationResult.videoUrl, `animated-${Date.now()}-${animationResult.sequenceIndex}`)
                  .then((analysisResult: VideoAnalysisResult) => {
                    logger.log(`[ANIMATE] Video analysis completed for sequence ${animationResult.sequenceIndex}`, {
                      descriptionsCount: analysisResult.descriptions.length,
                      framesCount: analysisResult.frames.length,
                      cost: analysisResult.cost
                    });
                    
                    cost += analysisResult.cost;
                    runningAnalyses--;
                    
                    // Start next analysis if available
                    startAnalysisIfPossible();
                    
                    return {
                      ...animationResult,
                      descriptions: analysisResult.descriptions,
                      frames: analysisResult.frames,
                      durationInSeconds: analysisResult.durationInSeconds
                    };
                  }).catch((error: Error) => {
                    logger.error(`[ANIMATE] Error analyzing animated video for sequence ${animationResult.sequenceIndex}:`, {
                      error: error instanceof Error ? error.message : String(error)
                    });
                    runningAnalyses--;
                    
                    // Start next analysis if available
                    startAnalysisIfPossible();
                    
                    return animationResult;
                  });
                
                // Store the analysis promise
                analysisPromises.set(requestId, analysisPromise);
              }
            };
            
            // Process animations with parallel status checking but sequential waits
            while (pendingRequests.size > 0) {
              // Check all pending requests status in parallel (no wait.for here)
              const statusChecks = Array.from(pendingRequests.keys()).map(async (requestId) => {
                try {
                  const status = await checkKlingRequestStatus(requestId, payload.animationMode);
                  return { requestId, status };
                } catch (error) {
                  logger.error(`[ANIMATE] Error checking status for request ${requestId}:`, {
                    error: error instanceof Error ? error.message : String(error)
                  });
                  return { requestId, status: { status: 'FAILED' } };
                }
              });
              
              // Wait for all status checks to complete
              const allStatuses = await Promise.all(statusChecks);
              
              // Process completed requests
              for (const { requestId, status } of allStatuses) {
                const request = pendingRequests.get(requestId);
                if (!request) continue;
                
                if (status.status === 'COMPLETED') {
                  try {
                    const result = await getKlingRequestResult(requestId, payload.animationMode);
                    
                    if (result.data?.video?.url) {
                      const animationResult = {
                        sequenceIndex: request.sequenceIndex,
                        videoUrl: result.data.video.url,
                        width: result.data.video.width || request.originalMedia.image?.width || 1920,
                        height: result.data.video.height || request.originalMedia.image?.height || 1080
                      };
                      
                      completedResults.set(requestId, animationResult);
                      
                      // Queue video analysis for this completed animation
                      logger.log(`[ANIMATE] Animation completed for sequence ${request.sequenceIndex}, queueing analysis...`);
                      analysisQueue.push({ requestId, animationResult });
                      
                      // Try to start analysis if slot available
                      startAnalysisIfPossible();
                      
                      completedAnimations++;
                      await metadata.replace({
                        name: Steps.ANIMATE_IMAGES,
                        progress: Math.round((completedAnimations / validRequests.length) * 100)
                      });
                    } else {
                      logger.error(`[ANIMATE] No video URL in result for request ${requestId}`);
                      completedResults.set(requestId, null);
                      completedAnimations++;
                    }
                  } catch (error) {
                    logger.error(`[ANIMATE] Error getting result for request ${requestId}:`, {
                      error: error instanceof Error ? error.message : String(error)
                    });
                    completedResults.set(requestId, null);
                    completedAnimations++;
                  }
                  
                  // Remove from pending
                  pendingRequests.delete(requestId);
                } else if (status.status === 'FAILED' || status.status === 'CANCELLED') {
                  logger.error(`[ANIMATE] Animation failed for request ${requestId} with status: ${status.status}`);
                  completedResults.set(requestId, null);
                  completedAnimations++;
                  pendingRequests.delete(requestId);
                }
              }
              
              // If there are still pending requests, wait before next check
              if (pendingRequests.size > 0) {
                await wait.for({ seconds: 6 });
              }
            }
            
            // Start any remaining analyses in the queue
            while (analysisQueue.length > 0) {
              startAnalysisIfPossible();
              
              // Wait a bit if we've reached the concurrency limit
              if (runningAnalyses >= maxConcurrentAnalyses) {
                await wait.for({ seconds: 1 });
              }
            }
            
            // Wait for all analyses to complete
            logger.log(`[ANIMATE] Waiting for all video analyses to complete...`);
            const analysisResults = await Promise.all(Array.from(analysisPromises.values()));
            
            // Filter out null results
            const successfulAnalyses = analysisResults.filter(result => result !== null);

            // Apply animated videos to sequences
            const successfulAnimations = successfulAnalyses.length;
            
            if (successfulAnimations > 0) {
              logger.log(`[ANIMATE] Processing ${successfulAnimations} analyzed animated videos...`);
              
              // Collect animated medias to add to space with analysis data
              const animatedMediasToAdd: IMediaSpace[] = [];
              
              successfulAnalyses.forEach(animation => {
                const sequence = sequences[animation.sequenceIndex];
                if (sequence && sequence.media) {
                  // Create the animated video media with analysis data
                  const animatedMedia: IMedia = {
                    type: 'video',
                    usage: 'media',
                    name: `Animated Image - ${Date.now()}`,
                    video: {
                      id: `animated-${Date.now()}-${animation.sequenceIndex}`,
                      quality: 'hd',
                      file_type: 'mp4',
                      size: 0,
                      width: animation.width,
                      height: animation.height,
                      fps: 30,
                      link: animation.videoUrl,
                      frames: 'frames' in animation ? animation.frames : [],
                      durationInSeconds: 'durationInSeconds' in animation ? animation.durationInSeconds : 5
                    }
                  };

                  // Add description if available and has at least one element
                  if ('descriptions' in animation && animation.descriptions && animation.descriptions.length > 0) {
                    animatedMedia.description = animation.descriptions as [{ start: number, duration?: number, text: string }];
                  }

                  // Add to collection for space
                  animatedMediasToAdd.push({
                    media: animatedMedia,
                    uploadedBy: payload.userId,
                    uploadedAt: new Date(),
                    autoPlacement: true
                  });

                  // Replace image with animated video in sequence, remove source
                  sequences[animation.sequenceIndex] = {
                    ...sequence,
                    media: {
                      ...animatedMedia,
                      source: undefined, // Remove extracted source
                    }
                  };
                }
              });

              // Add animated medias to space
              if (animatedMediasToAdd.length > 0) {
                try {
                  await addMediasToSpace(payload.spaceId, animatedMediasToAdd);
                  logger.log(`[ANIMATE] Added ${animatedMediasToAdd.length} analyzed animated videos to space`);
                  
                  // Deduct credits for each animated image
                  const creditsPerAnimation = KLING_GENERATION_COSTS[payload.animationMode];
                  const totalCreditsToDeduct = animatedMediasToAdd.length * creditsPerAnimation;
                  
                  await removeCreditsToSpace(payload.spaceId, totalCreditsToDeduct);
                  logger.log(`[ANIMATE] Deducted ${totalCreditsToDeduct} credits (${animatedMediasToAdd.length} × ${creditsPerAnimation}) for image animations`);
                  
                  // Increment image to video usage counter
                  for (let i = 0; i < animatedMediasToAdd.length; i++) {
                    await incrementImageToVideoUsage(payload.spaceId);
                  }
                  logger.log(`[ANIMATE] Incremented image to video usage by ${animatedMediasToAdd.length}`);
                  
                } catch (error) {
                  logger.error(`[ANIMATE] Error adding animated medias to space or deducting credits:`, {
                    error: error instanceof Error ? error.message : String(error)
                  });
                }
              }
            }

            logger.log(`[ANIMATE] Successfully animated ${successfulAnimations}/${validRequests.length} images`);
          }
        }

        await metadata.replace({
          name: Steps.ANIMATE_IMAGES,
          progress: 100
        });

        logger.log(`[ANIMATE] Image animation process completed`);
      }

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

    /*
    /
    /   Apply zoom recommendations to sequences
    /
    if (zoomPromise) {
      logger.log(`[ZOOM] Waiting for zoom insertion analysis to complete...`);
      
      try {
        const { cost: zoomCost, zooms } = await zoomPromise;
        cost += zoomCost;
        
        logger.log(`[ZOOM] Zoom analysis completed with ${zooms.length} recommendations`, { 
          zoomCost,
          zooms: zooms.slice(0, 5) // Log premiers 5 pour debug
        });

        // Appliquer les zooms aux séquences (approche optimisée avec index)
        if (zooms.length > 0) {
          zooms.forEach(zoomRecommendation => {
            const sequenceIndex = zoomRecommendation.sequence;
            const wordIndex = zoomRecommendation.word;
            
            // Vérifier que la séquence et le mot existent
            if (sequenceIndex !== undefined && wordIndex !== undefined && 
                sequenceIndex >= 0 && sequenceIndex < sequences.length) {
              const sequence = sequences[sequenceIndex];
              
              if (wordIndex >= 0 && wordIndex < sequence.words.length && zoomRecommendation.type) {
                const targetWord = sequence.words[wordIndex].word;
                
                logger.log(`[ZOOM] Applying ${zoomRecommendation.type} zoom to word "${targetWord}" (index ${wordIndex}) in sequence ${sequenceIndex}`, {
                  intent: zoomRecommendation.intent
                });
                
                // Appliquer directement le zoom au mot par index
                sequences[sequenceIndex].words[wordIndex].zoom = zoomRecommendation.type as ZoomType;
              }
            }
          });

          logger.log(`[ZOOM] Applied ${zooms.length} zoom effects to sequences`);
        }
      } catch (error) {
        logger.error(`[ZOOM] Error processing zoom analysis:`, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    */

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

    const updatedSpace : ISpace | undefined = await updateSpaceLastUsed(payload.spaceId, payload.voice ? payload.voice.id : undefined, payload.avatar ? payload.avatar.id : "999")

    let subtitle = subtitles[1]
    let videoFormat: "vertical" | "ads" | "square" = payload.format || "vertical"; // Utiliser le format fourni ou par défaut
    
    if (updatedSpace && updatedSpace.lastUsed?.subtitles) {
      const mostFrequent = getMostFrequentString(updatedSpace.lastUsed.subtitles)
      if (mostFrequent) {
        const subtitleFind = subtitles.find((subtitleItem) => subtitleItem.name === mostFrequent);
        if (subtitleFind) {
          subtitle = subtitleFind;
        } else {
          const subtitleFindFromSpace = updatedSpace.subtitleStyle.find((subtitleItem) => subtitleItem.name === mostFrequent);
          if (subtitleFindFromSpace) {
            subtitle = subtitleFindFromSpace;
          }
        }
      }
    }

    // Si aucun format n'est fourni via l'API, utiliser les préférences du space
    if (!payload.format && updatedSpace && updatedSpace.lastUsed?.formats && updatedSpace.lastUsed.formats.length > 0) {
      const mostFrequentFormat = getMostFrequentString(updatedSpace.lastUsed.formats);
      if (mostFrequentFormat && ['vertical', 'ads', 'square'].includes(mostFrequentFormat)) {
        videoFormat = mostFrequentFormat as "vertical" | "ads" | "square";
      }
    }

    newVideo = {
      ...newVideo,
      costToGenerate: cost + (ctx.run.baseCostInCents || 0),
      state: {
        type: 'done',
      },
      settings: updatedSpace?.lastUsed?.config,
      extractedMedia: extractedMedias.length > 0 ? extractedMedias : undefined,
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
        format: videoFormat,
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

    /*
    /
    /   Apply automatic zoom to image sequences
    /
    */
    if (newVideo.video && newVideo.video.sequences) {
      logger.log(`[ZOOM] Applying automatic zoom to image sequences...`);
      
      let isZoomIn = true; // Alternance entre zoom-in et zoom-out
      
      newVideo.video.sequences.forEach((sequence, sequenceIndex) => {
        // Vérifier si la séquence a une image comme média
        if (sequence.media && sequence.media.type === 'image' && sequence.words && sequence.words.length > 0) {
          // Appliquer le zoom au premier mot de la séquence
          const zoomType = isZoomIn ? 'zoom-in-continuous' : 'zoom-out-continuous';
          sequence.words[0].zoom = zoomType;
          
          logger.log(`[ZOOM] Applied ${zoomType} to first word of sequence ${sequenceIndex} with image media`);
          
          // Alterner pour la prochaine séquence
          isZoomIn = !isZoomIn;
        }
      });
      
      logger.log(`[ZOOM] Automatic zoom application completed`);
    }

    newVideo = await updateVideo(newVideo)

    // Calculer les crédits de génération basés sur la durée réelle de la vidéo
    let costCredit = 0;
    if (newVideo.video?.metadata?.audio_duration) {
      costCredit = calculateGenerationCredits(newVideo.video.metadata.audio_duration);
      
      // Retirer les crédits du space seulement si deductCredits est true (API publique)
      if (payload.deductCredits) {
        try {
          await removeCreditsToSpace(payload.spaceId, costCredit);
          logger.log(`[CREDITS] Deducted ${costCredit} credits for video generation (duration: ${newVideo.video.metadata.audio_duration}s)`, {
            spaceId: payload.spaceId,
            videoDuration: newVideo.video.metadata.audio_duration,
            creditsDeducted: costCredit
          });
        } catch (error) {
          logger.error(`[CREDITS] Error deducting generation credits:`, {
            error: error instanceof Error ? error.message : String(error),
            spaceId: payload.spaceId,
            creditsToDeduct: costCredit
          });
        }
      } else {
        logger.log(`[CREDITS] Calculated ${costCredit} credits for video generation but not deducting (deductCredits=false)`, {
          spaceId: payload.spaceId,
          videoDuration: newVideo.video.metadata.audio_duration,
          creditsCalculated: costCredit
        });
      }
    }

    let user;
    logger.log('[VIDEO COUNT] Adding video count to contact', { userId: payload.userId });
    if (payload.userId) {
      user = await addVideoCountContact(payload.userId)
    }

    if (payload.userId && user && user.videosCount === 0) {
      await sendCreatedVideoEvent({ email: user.email, videoId: newVideo.id || "" })
      track(MixpanelEvent.FIRST_VIDEO_CREATED, {
        distinct_id: payload.userId,
        videoId: newVideo.id,
        hasAvatar: payload.avatar ? true : false,
      })
    }

    // Envoyer webhook si configuré
    if (payload.webhookUrl) {
      try {
        const { sendWebhookWithRetry } = await import('../lib/webhooks');
        await sendWebhookWithRetry(payload.webhookUrl, {
          job_id: ctx.run.id,
          status: 'completed',
          result: {
            video_id: newVideo.id,
            thumbnail_url: newVideo.video?.thumbnail,
            cost: payload.deductCredits ? costCredit : cost, // Utilise costCredit pour l'API publique, cost pour l'application
            created_at: new Date().toISOString()
          }
        });
      } catch (error) {
        logger.error('[WEBHOOK] Error sending completion webhook:', { error: error instanceof Error ? error.message : String(error) });
      }
    }

    return {
      videoId: newVideo.id,
      cost: cost, // Coût réel interne
      costCredit: costCredit // Coût en crédits facturé au client
    }
  },
});

function extractVoiceSegments(sequences: ISequence[], sentences: ISentence[], voiceId?: string, emotionEnhancement?: boolean): {
  index: number;
  url: string;
  start: number;
  end: number;
  durationInFrames: number;
  voiceId?: string;
  emotionEnhancement?: boolean;
}[] {
  const voiceSegments = new Map<number, {
    start: number;
    end: number;
    durationInFrames: number;
    sequences: ISequence[];
    voiceId?: string;
    emotionEnhancement?: boolean;
  }>();

  // Grouper les séquences par audioIndex
  sequences.forEach(sequence => {
    if (!voiceSegments.has(sequence.audioIndex)) {
      voiceSegments.set(sequence.audioIndex, {
        start: sequence.start,
        end: sequence.end,
        durationInFrames: sequence.durationInFrames || 0,
        sequences: [sequence],
        voiceId: voiceId || undefined,
        emotionEnhancement: emotionEnhancement || false
      });
    } else {
      const current = voiceSegments.get(sequence.audioIndex)!;
      current.end = sequence.end;
      current.durationInFrames += sequence.durationInFrames || 0;
      current.sequences.push(sequence);
      current.voiceId = voiceId || undefined;
      current.emotionEnhancement = emotionEnhancement || false
    }
  });

  // Convertir en tableau avec tous les segments
  const result = Array.from(voiceSegments.entries()).map(([index, data]) => ({
    index,
    url: sentences[index].audioUrl,
    start: data.start,
    end: data.end,
    durationInFrames: data.durationInFrames,
    voiceId,
    emotionEnhancement: data.emotionEnhancement
  }));

  // Si aucun résultat, retourner au moins un segment par défaut
  return result.length > 0 ? result : [{
    index: 0,
    url: '',
    start: 0,
    end: 0,
    durationInFrames: 0,
    voiceId,
    emotionEnhancement: emotionEnhancement || false
  }];
}

/**
 * Process promises in batches with limited concurrency
 * @param items Array of items to process
 * @param processor Function that processes each item and returns a Promise
 * @param batchSize Maximum number of concurrent operations
 * @returns Promise that resolves with array of results
 */
async function processBatches<T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  batchSize: number = 7
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map((item, batchIndex) => 
      processor(item, i + batchIndex)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Apply voice enhancements to the script
 * @param script Original script
 * @param enhancements Array of enhancements to apply
 * @returns Enhanced script
 */
function applyVoiceEnhancements(
  script: string,
  enhancements: { type?: string, value?: string, word?: string, occurrence?: number }[]
): string {
  let enhancedScript = script;

  // Sort enhancements by occurrence to apply them in order
  const sortedEnhancements = enhancements.sort((a, b) => (a.occurrence || 0) - (b.occurrence || 0));

  for (const enhancement of sortedEnhancements) {
    if (!enhancement.word || !enhancement.type) continue;
    
    // For 'caps' and 'ellipsis' types, value is not required
    if (enhancement.type === 'tag' && !enhancement.value) continue;

    const wordToReplace = enhancement.word;
    const enhancementType = enhancement.type;
    const enhancementValue = enhancement.value;

    // Find the word in the script (case insensitive)
    const regex = new RegExp(`\\b${wordToReplace.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = Array.from(enhancedScript.matchAll(regex));

    if (matches.length > 0) {
      // Apply enhancement based on occurrence (1-indexed)
      const targetOccurrence = enhancement.occurrence || 1;
      const targetIndex = targetOccurrence - 1;

      if (targetIndex < matches.length && matches[targetIndex]) {
        const match = matches[targetIndex];
        const matchIndex = match.index!;
        const originalWord = match[0];

        let enhancedWord = originalWord;
        
        switch (enhancementType) {
          case 'tag':
            // Add tag before the word (no space)
            // Ensure the tag value is wrapped in brackets if not already
            if (enhancementValue) {
              const tagValue = enhancementValue.startsWith('[') ? enhancementValue : `[${enhancementValue}]`;
              enhancedWord = `${tagValue}${originalWord}`;
            }
            break;
          case 'caps':
            // Convert word to uppercase
            enhancedWord = originalWord.toUpperCase();
            break;
          case 'ellipsis':
            // Add ellipsis after the word
            enhancedWord = `${originalWord}...`;
            break;
        }

        // Replace the specific occurrence
        enhancedScript = 
          enhancedScript.substring(0, matchIndex) + 
          enhancedWord + 
          enhancedScript.substring(matchIndex + originalWord.length);
      }
    }
  }

  return enhancedScript;
}