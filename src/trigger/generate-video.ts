import { logger, metadata, task, wait } from "@trigger.dev/sdk/v3";
import { Steps } from "../types/step";
import { UploadedFile } from "../types/files";
import { Voice } from "../types/voice";
import { AvatarLook } from "../types/avatar";
import { createAudioTTS } from "../lib/elevenlabs";
import { uploadToS3Audio } from "../lib/r2";
import { createTranscription, getTranscription } from "../lib/gladia";

import transcriptionMock from "../test/mockup/transcriptionComplete.json";
import keywordsMock from "../test/mockup/keywordsResponse.json";
import sequencesWithMediaMock from "../test/mockup/sequencesWithMedia.json";
import { createLightTranscription, splitIntoSequences } from "../lib/transcription";
import { ffmpegExtractAudioSegments } from "./separate-audio";
import { generateKeywords } from "../lib/keywords";
import { calculateElevenLabsCost } from "../lib/cost";
import { searchMediaForSequence } from "../service/media.service";
import { ISequence, IVideo } from "../types/video";
import { createVideo, updateVideo } from "../dao/videoDao";
import { generateBrollDisplay, generateStartData } from "../lib/ai";
import { subtitles } from "../config/subtitles.config";
import { analyzeMediaWithSieve, getAnalysisResult, getJobCost, SieveCostResponse } from "../lib/sieve";
import { applyShowBrollToSequences, ShowBrollResult, simplifySequences } from "../lib/analyse";
import { music } from "../config/musics.config";
import { Genre } from "../types/music";

interface GenerateVideoPayload {
  spaceId: string
  userId: string
  files: UploadedFile[]
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
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: GenerateVideoPayload, { ctx }) => {

    let cost = 0
    const mediaSource = payload.mediaSource || "PEXELS";
    const avatarFile = payload.files.find(f => f.usage === 'avatar')
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

    /*
    /
    /   Get voice
    /
    */

    let voiceUrl = ""
    const voiceFile: UploadedFile | undefined = payload.files?.find(file => file.usage === "voice");

    logger.log(`[VOICE] Start voice generation...`)

    if (ctx.environment.type === "DEVELOPMENT") {
      await metadata.replace({
        name: Steps.VOICE_GENERATION,
        progress: 0
      })

      voiceUrl = "https://media.hoox.video/db9b9f57-bd1a-42ac-8095-d28b7d52a4e4.mp3"

      await metadata.replace({
        name: Steps.VOICE_GENERATION,
        progress: 100
      })

    } else if (voiceFile) {
      logger.log(`[VOICE] Voice file already uploaded`)
      voiceUrl = voiceFile.url
    } else if (!avatarFile) {
      logger.log(`[VOICE] Generate voice with elevenlabs...`)

      await metadata.replace({
        name: Steps.VOICE_GENERATION,
        progress: 0
      })

      const audioBuffer = await createAudioTTS(payload.voice.id, payload.script);
      voiceUrl = await uploadToS3Audio(audioBuffer, 'medias-users');

      cost += calculateElevenLabsCost(payload.script)

      await metadata.replace({
        name: Steps.VOICE_GENERATION,
        progress: 100
      })
    } else if (avatarFile) {
      voiceUrl = avatarFile.url
    }

    logger.log(`[VOICE] Voice URL: ${voiceUrl}`)

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

    
    let transcription: any;

    if (ctx.environment.type === "DEVELOPMENT") {
      transcription = transcriptionMock
      await metadata.replace({
        name: Steps.TRANSCRIPTION,
        progress: 100
      })
    } else {
      const createTranscriptionResponse = await createTranscription(voiceUrl);
      let transcriptionData: any;

      await pollTranscriptionStatus(createTranscriptionResponse.id)
        .then((completedTranscription) => {
          transcriptionData = completedTranscription;
        })
        .catch(logger.error);

      transcription = transcriptionData?.result;
    }

    logger.info('Transcription', transcription)

    if (!payload.script) {
      const script = transcription.transcription.utterances.map((utterance: any) => utterance.text).join(' ');
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

    /*
    /
    /   Clean transcription to get 2-3sec sequence separate and adjust words timing
    /   Get Light JSON to send to AI and reduce cost
    /
    */

    let sequences = splitIntoSequences(transcription.transcription.utterances, transcription.metadata.audio_duration);
    const lightTranscription = createLightTranscription(sequences);

    logger.info('Sequences', { sequences })
    logger.info('Light transcription', { lightTranscription })

    await metadata.replace({
      name: Steps.TRANSCRIPTION,
      progress: 100
    })

    logger.log(`[TRANSCRIPTION] Transcription done`)

    /*
    /
    /   Extract audio segments
    /
    */

    //const result = await ffmpegExtractAudioSegments.triggerAndWait({
    //  audioUrl: voiceUrl,
    //  sequences
    //})

    //if (result.ok) {
    //  sequences = result.output
    //}

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

    if (ctx.environment.type === "DEVELOPMENT") {
      keywords = keywordsMock
    } else {
      const resultKeywords = await generateKeywords(lightTranscription)
      keywords = resultKeywords?.keywords

      cost += resultKeywords?.cost || 0

      logger.info('Keywords', resultKeywords?.keywords)
      logger.info('Cost', { cost: resultKeywords?.cost })
    }

    logger.log(`[KEYWORDS] Keywords done`)

    /*
    /
    /   Search media for sequences
    /
    */

    logger.log(`[MEDIA] Search media...`);

    if (ctx.environment.type === "DEVELOPMENT") {
      sequences = sequencesWithMediaMock as ISequence[]
    } else {

      const batchSize = 5;
      const updatedSequences = [];
      for (let i = 0; i < sequences.length; i += batchSize) {
          const batch = sequences.slice(i, i + batchSize);
          const batchPromises = batch.map((sequence, idx) => 
              searchMediaForSequence(sequence, i + idx + 1, keywords, mediaSource)
          );

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

    if (ctx.environment.type !== "DEVELOPMENT" && (payload.avatar || avatarFile)) {
      logger.log(`[ANALYSIS] Starting media analysis...`);
      const { sequences: updatedSequences, totalCost } = await processBatchWithSieve(sequences);
      sequences = updatedSequences;
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
        videoUrl: avatarFile.url
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

    newVideo = {
      ...newVideo,
      costToGenerate: cost + ctx.run.baseCostInCents,
      state: {
        type: 'done',
      },
      video: {
        audio: {
          url: voiceUrl,
          volume: 1,
          music: videoMusic ? {
            url: videoMusic.url,
            volume: 0.10,
            name: videoMusic.name,
            genre: videoMusic.genre
          } : undefined
        },
        thumbnail: "",
        metadata: transcription.metadata,
        sequences,
        avatar,
        subtitle: {
          name: subtitles[1].name,
          style: subtitles[1].style,
        }
      }
    }

    await updateVideo(newVideo)

    return {
      videoId: newVideo.id,
    }
  },
});

const pollTranscriptionStatus = async (transcriptionId: string) => {
  let attempts = 0;
  const maxAttempts = 100;
  const delayBetweenAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const transcriptionStatus = await getTranscription(transcriptionId);

      if (transcriptionStatus.status === 'processing') {
        await metadata.replace({
          name: Steps.TRANSCRIPTION,
          progress: attempts
        })
      } else if (transcriptionStatus.status === 'done') {
        await metadata.replace({
          name: Steps.TRANSCRIPTION,
          progress: 100
        })
        return transcriptionStatus;
      }

      await wait.for({ seconds: delayBetweenAttempts });
      attempts++;
    } catch (error) {
      logger.error(`Error while getting transcription status: ${error}`);
      await wait.for({ seconds: delayBetweenAttempts });
      attempts++;
    }
  }

  throw new Error('Nombre maximum de tentatives atteint sans obtenir un statut "done" pour la transcription.');
};

const processBatchWithSieve = async (sequences: any[]) => {
  const updatedSequences = [...sequences];
  let totalCost = 0;
  let finishedSequences = 0;

  logger.log('Sequences', { sequences })
  logger.log('Sequences length', { length: sequences.length })
  
  for (let i = 0; i < sequences.length; i += 3) { //3 - max concurrent jobs
      const batch = sequences.slice(i, Math.min(i + 3, sequences.length));
      
      const analysisPromises = batch.map(async (sequence, index) => {
          const mediaUrl = sequence.media.type === 'video' ? sequence.media.video.link : sequence.media.image.link;

          logger.log('Media URL', { mediaUrl })
          
          if (!mediaUrl) return sequence;

          try {
              logger.log('Analyze media', { mediaUrl })
              const jobId : string = await analyzeMediaWithSieve(mediaUrl);
              logger.log(`Job ID`, { jobId })
              const description = await getAnalysisResult(jobId, 0, mediaUrl);
              logger.log('Description', { description })

              //const costInfo : SieveCostResponse = await getJobCost(jobId);
              //totalCost += costInfo.cost;
              
              if (description) {
                  logger.log('Description', { description })
                  updatedSequences[i + index].media.description = description;
                  finishedSequences++;
                  await metadata.replace({
                    name: Steps.ANALYZE,
                    progress: Math.round(finishedSequences / sequences.length * 100)
                  })
              }
          } catch (error: any) {
              logger.error(`Failed to analyze media for sequence ${i + index}:`, error.response?.data || error.message);
          }
          
          return sequence;
      });

      await Promise.all(analysisPromises);
  }

  return {
      sequences: updatedSequences,
      totalCost
  };
}