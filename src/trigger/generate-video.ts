import { logger, metadata, task, wait } from "@trigger.dev/sdk/v3";
import { Steps } from "../types/step";
import { UploadedFile } from "../types/files";
import { Voice } from "../types/voice";
import { AvatarLook } from "../types/avatar";
import { createAudioTTS } from "../lib/elevenlabs";
import { uploadToS3Audio } from "../lib/r2";
import { createTranscription, getTranscription } from "../lib/gladia";

import transcriptionMock from "../test/mockup/transcriptionComplete.json";
import keywordsMock from "../test/mockup/keywords/llama3170b.json";
import { createLightTranscription, splitIntoSequences } from "../lib/transcription";
import { ffmpegExtractAudioSegments } from "./separate-audio";
import { generateKeywords } from "../lib/keywords";
import { calculateElevenLabsCost } from "../lib/cost";
import { searchMediaForSequence } from "../service/media.service";
import { IVideo } from "../types/video";
import { createVideo, updateVideo } from "../dao/videoDao";
import { generateStartData } from "../lib/ai";

interface GenerateVideoPayload {
  space: string
  userId: string
  files: UploadedFile[]
  script: string
  voice: Voice
  avatar: AvatarLook
  mediaSource: string
}

export const generateVideoTask = task({
  id: "generate-video",
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: GenerateVideoPayload, { ctx }) => {

    let cost = 0
    const mediaSource = payload.mediaSource || "PEXELS";

    logger.log("Generating video...", { payload, ctx });

    let video : IVideo = {
      spaceId: payload.space,
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

    const startData = generateStartData(payload.script).then((data) => {
      logger.info('Start data', data?.details)
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

      voiceUrl = "https://media.hoox.video/2070cf26-1edb-41aa-9653-bb54940abaf1.mp3"

      await metadata.replace({
        name: Steps.VOICE_GENERATION,
        progress: 100
      })

    } else if (voiceFile) {
      logger.log(`[VOICE] Voice file already uploaded`)
      voiceUrl = voiceFile.url
    } else {
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
    /   Search media for sequences
    /
    */

    logger.log(`[MEDIA] Search media...`)

    

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
    logger.info('Sequences taille', { size: sequences.length })
    logger.info('Sequences', { sequences })

    await metadata.replace({
      name: Steps.SEARCH_MEDIA,
      progress: 100,
    });


    logger.log(`[MEDIA] Media search completed`)

    newVideo = {
      ...newVideo,
      costToGenerate: cost,
      state: {
        type: 'done',
      },
      video: {
        audioUrl: voiceUrl,
        thumbnail: "",
        metadata: transcription.metadata,
        sequences
      }
    }

    logger.info('Cost infra', { costInCents: ctx.run.costInCents })

    await updateVideo(newVideo)

    return {
      message: "Hello, world!",
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