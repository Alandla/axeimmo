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
import { createLightTranscription, splitIntoSequences } from "../lib/transcription";
import { ffmpegExtractAudioSegments } from "./separate-audio";
import { basicApiCall } from "../lib/api";
import { generateKeywords } from "../lib/keywords";
import { calculateElevenLabsCost } from "../lib/cost";

interface GenerateVideoPayload {
  files: UploadedFile[]
  script: string
  voice: Voice
  avatar: AvatarLook
}

export const generateVideoTask = task({
  id: "generate-video",
  maxDuration: 300, // Stop executing after 300 secs (5 mins) of compute
  run: async (payload: GenerateVideoPayload, { ctx }) => {

    let cost = 0

    logger.log("Generating video...", { payload, ctx });

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

      voiceUrl = "https://media.hoox.video/903fe842-64d8-4101-ad9d-7960f965536f.mp3"

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
    /   Get Light JSON to send to MistralAI and reduce cost
    /
    */

    let sequences = splitIntoSequences(transcription.transcription.utterances, transcription.metadata.audio_duration);
    const lightTranscription = createLightTranscription(sequences);

    logger.info('Sequences', { sequences })
    logger.info('Light transcription', { lightTranscription })

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
      
      await metadata.replace({
        name: Steps.SEARCH_MEDIA,
        progress: 100
      })
    } else {
      const resultKeywords = await generateKeywords(lightTranscription)

      cost += resultKeywords?.cost || 0

      logger.info('Keywords', resultKeywords?.keywords)
      logger.info('Cost', { cost: resultKeywords?.cost })
    }

    logger.log(`[KEYWORDS] Keywords done`)

    logger.log(`[MEDIA] Search media...`)

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