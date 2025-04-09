import { logger, metadata, task, wait } from "@trigger.dev/sdk/v3";
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
import { generateKeywords } from "../lib/keywords";
import { calculateElevenLabsCost } from "../lib/cost";
import { mediaToMediaSpace, searchMediaForSequence } from "../service/media.service";
import { IMedia, IVideo } from "../types/video";
import { createVideo, updateVideo } from "../dao/videoDao";
import { generateBrollDisplay, generateStartData, matchMediaToSequences } from "../lib/ai";
import { subtitles } from "../config/subtitles.config";
import { analyzeSimpleVideoWithSieve, analyzeVideoWithSieve, getAnalysisResult, getJobCost, SieveCostResponse } from "../lib/sieve";
import { applyShowBrollToSequences, ShowBrollResult, simplifyMedia, simplifySequences } from "../lib/analyse";
import { music } from "../config/musics.config";
import { Genre } from "../types/music";
import { addMediasToSpace, updateSpaceLastUsed } from "../dao/spaceDao";
import { IMediaSpace, ISpace } from "../types/space";
import { addVideoCountContact, sendCreatedVideoEvent } from "../lib/loops";
import { getMostFrequentString } from "../lib/utils";

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

    const isDevelopment = ctx.environment.type === "PRODUCTION"

    let videoStyle: string | undefined;

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

      sentences = sentencesNoTranscriptionMock

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
        .match(/[^.!?]+[.!?]+/g) || [payload.script];
      
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
      for (let i = 0; i < rawSentences.length; i += 5) {
        const batch = rawSentences.slice(i, Math.min(i + 5, rawSentences.length));
        
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
        
        logger.info('All sentences transcribed with Groq', { totalCount: sentences.length });
      } catch (error) {
        logger.error('Error in transcription process', { errorMessage: error instanceof Error ? error.message : String(error) });
      }
    }

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
    
    if (!payload.script) {
      const script = lightTranscription.map(item => item.text).join(' ');
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
    }

    await metadata.replace({
      name: Steps.TRANSCRIPTION,
      progress: 100
    })

    logger.log(`[TRANSCRIPTION] Transcription done`)

    /*
    /
    /   Analyse user medias
    /
    */

    logger.log(`[ANALYZE] Start analyze...`)

    if (payload.files.some(file => file.usage === 'media')) {
      await metadata.replace({
        name: Steps.ANALYZE_YOUR_MEDIA,
        progress: 0
      })
      
      const mediasToAnalyze = payload.files.filter(file => file.usage === 'media');

      const { medias: analyzedMedias, totalCost } = await processBatchWithSieve(mediasToAnalyze, {
        isDetailedAnalysis: true,
        onProgress: async (progress) => {
          await metadata.replace({
            name: Steps.ANALYZE_YOUR_MEDIA,
            progress
          });
        }
      });

      logger.info('Analyzed medias', { analyzedMedias })

      const mediasSpace : IMediaSpace[] = mediaToMediaSpace(analyzedMedias, payload.userId)

      await addMediasToSpace(payload.spaceId, mediasSpace)

      logger.info('Analyzed medias', { analyzedMedias })
      logger.info('Total cost', { totalCost })

      const simplifiedMedia = simplifyMedia(analyzedMedias)
      const assignments = await matchMediaToSequences(lightTranscription, simplifiedMedia)

      logger.info('Sequences', { lightTranscription })
      logger.info('Simplified media', { simplifiedMedia })
      logger.info('Assignments', { assignments })

      // Mettre à jour les séquences avec les médias assignés en utilisant l'index
      sequences = sequences.map((sequence, index) => {
        const assignment = assignments?.assignments.find((a: any) => a.sequenceId === index);
        if (assignment) {
          const media = analyzedMedias[assignment.mediaId];
          if (media) {
            return {
              ...sequence,
              media: {
                ...media,
                startAt: media.description && media.description.length > 1 ? media.description[assignment.description_index].start : 0,
                description: media.description ? [media.description[assignment.description_index]] : undefined
              }
            };
          }
        }
        return sequence;
      });

      logger.info('Sequences with media', { sequences })

      await metadata.replace({
        name: Steps.ANALYZE_YOUR_MEDIA,
        progress: 100
      })
    }
    

    /*
    /
    /   Generate keywords
    /
    */

    logger.log(`[KEYWORDS] Search keywords...`)

    await metadata.replace({
      name: Steps.SEARCH_MEDIA,
      progress: 0
    })

    let keywords: any;

    if (isDevelopment) {
      keywords = keywordsMock
    } else {
      const resultKeywords = await generateKeywords(lightTranscription)
      keywords = resultKeywords?.keywords || []

      cost += resultKeywords?.cost || 0

      logger.info('Keywords', { keywords: resultKeywords?.keywords || [] })
      logger.info('Cost', { cost: resultKeywords?.cost || 0 })
    }

    logger.log(`[KEYWORDS] Keywords done`)

    /*
    /
    /   Search media for sequences
    /
    */

    logger.log(`[MEDIA] Search media...`);

    if (isDevelopment) {
      sequences = sequencesWithMediaMock as ISequence[]
    } else {
      const batchSize = 5;
      const updatedSequences = [];

      for (let i = 0; i < sequences.length; i += batchSize) {
          const batch = sequences.slice(i, i + batchSize);
          const batchPromises = batch.map((sequence, idx) => {
              return searchMediaForSequence(sequence, i + idx, keywords, mediaSource);
          });

          const completedBatch = await Promise.all(batchPromises);
          updatedSequences.push(...completedBatch);

          // Update progress
          const progress = Math.round((updatedSequences.length / sequences.length) * 100);
          await metadata.replace({
              name: Steps.SEARCH_MEDIA,
              progress
          });
      }

      sequences = updatedSequences;

      await metadata.replace({
        name: Steps.SEARCH_MEDIA,
        progress: 100,
      });

      logger.log(`[MEDIA] Media search completed`)

    }

    /*
    /
    /   Analyze
    /
    */

    if (!isDevelopment && (payload.avatar || avatarFile)) {
      logger.log(`[ANALYSIS] Starting media analysis...`);
      
      const mediasToAnalyze = sequences.map(seq => seq.media)
        .filter((media): media is IMedia => 
          !!media && !media.description // On ne garde que les médias sans description
        );
      console.log('Medias to analyze', { mediasToAnalyze })
      const { medias: analyzedMedias, totalCost } = await processBatchWithSieve(mediasToAnalyze, {
        isDetailedAnalysis: false,
        onProgress: async (progress) => {
          await metadata.replace({
            name: Steps.ANALYZE_NEW_MEDIA,
            progress
          });
        }
      });

      sequences = sequences.map(seq => {
        if (seq.media) {
          const analyzedMedia = analyzedMedias.find(m => 
            (m.video?.id === seq.media?.video?.id) || 
            (m.image?.id === seq.media?.image?.id)
          );
          return {
            ...seq,
            media: analyzedMedia || seq.media
          };
        }
        return seq;
      });

      cost += totalCost;
      logger.info(`Analyse vidéo terminée. Coût total: $${totalCost}`);
      const dataForAnalysis = simplifySequences(sequences);
      logger.info('Data for analysis', { dataForAnalysis })
      const showBrollResult : ShowBrollResult | null = await generateBrollDisplay(dataForAnalysis)
      logger.info('Show broll result', { showBrollResult })
      if (showBrollResult) {
        sequences = applyShowBrollToSequences(sequences, showBrollResult)
      }
    }

    logger.info('Sequences taille', { size: sequences.length })
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
    logger.info('Video style', { videoStyle })
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

    logger.info('Auto transitions', { autoTransitions })

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
    }

    return {
      videoId: newVideo.id,
    }
  },
});

interface ProcessBatchOptions {
  isDetailedAnalysis?: boolean;
  batchSize?: number;
  onProgress?: (progress: number) => Promise<void>;
}

const processBatchWithSieve = async (
  medias: IMedia[],
  options: ProcessBatchOptions = {}
) => {
  const {
    isDetailedAnalysis = false,
    batchSize = 10,
    onProgress
  } = options;

  const updatedMedias = [...medias];
  let totalCost = 0;
  let finishedMedias = 0;
  
  for (let i = 0; i < medias.length; i += batchSize) {
    const batch = medias.slice(i, Math.min(i + batchSize, medias.length));
    
    const analysisPromises = batch.map(async (media, index) => {
      const mediaUrl = media.type === 'video' ? media.video?.link : media.image?.link;
      const sdMediaUrl = media.type === 'video' ? media.sdVideoUrl : null;
      
      if (!mediaUrl) return media;

      try {
        logger.log('Analyze media', { mediaUrl })
        let jobId : string
        if (isDetailedAnalysis) {
          jobId = await analyzeVideoWithSieve(mediaUrl);
        } else {
          jobId = await analyzeSimpleVideoWithSieve(sdMediaUrl || mediaUrl);
        }
        logger.log(`Job ID`, { jobId })
        const description = await getAnalysisResult(jobId, 0, mediaUrl, isDetailedAnalysis);

        if (description) {
          logger.log('Description', { description })
          updatedMedias[i + index].description = description;
          finishedMedias++;
          
          if (onProgress) {
            await onProgress(Math.round(finishedMedias / medias.length * 100));
          }
        }
      } catch (error: any) {
        logger.error(`Failed to analyze media ${i + index}:`, error.response?.data || error.message);
      }
      
      return media;
    });

    await Promise.all(analysisPromises);
  }

  return {
    medias: updatedMedias,
    totalCost
  };
}

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