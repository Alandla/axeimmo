import { logger, metadata, task, wait } from "@trigger.dev/sdk/v3";
import { Steps } from "../types/step";
import { UploadedFile } from "../types/files";
import { Voice } from "../types/voice";
import { AvatarLook } from "../types/avatar";
import { createAudioTTS } from "../lib/elevenlabs";
import { uploadToS3Audio } from "../lib/r2";
import { createTranscription, getTranscription } from "../lib/gladia";

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
    logger.log("Generating video...", { payload, ctx });

    /*
    /
    /   Get voice
    /
    */

    let voiceUrl = ""
    const voiceFile: UploadedFile | undefined = payload.files?.find(file => file.usage === "voice");

    logger.log(`[VOICE] Start voice generation...`)

    if (voiceFile) {
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

    const createTranscriptionResponse = await createTranscription(voiceUrl);
    let transcriptionData: any;
    await pollTranscriptionStatus(createTranscriptionResponse.id)
      .then((completedTranscription) => {
        transcriptionData = completedTranscription;
      })
      .catch(logger.error);

    const transcription = transcriptionData?.result;
    console.log(transcription)

    logger.log(`[TRANSCRIPTION] Transcription done`)

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