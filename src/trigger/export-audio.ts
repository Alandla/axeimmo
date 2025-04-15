import { logger, metadata, task, wait } from "@trigger.dev/sdk/v3";
import { getVideoById } from "../dao/videoDao";
import { getProgress, renderAudio } from "../lib/render";
import { IVideo } from "../types/video";

interface RenderStatus {
  status: string;
  progress?: number;
  videoUrl?: string | null;
  costs?: number;
  message?: string;
}

interface ExportAudioPayload {
  videoId: string
}

export const exportAudioTask = task({
  id: "export-audio",
  maxDuration: 180,
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: ExportAudioPayload, { ctx }) => {
    try {
      const videoId = payload.videoId;

      logger.log("Exporting audio...");

      const video : IVideo | null = await getVideoById(videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      // Render audio only
      const render = await renderAudio(video);
      logger.log("Render started", { renderId: render.renderId, bucketName: render.bucketName });

      const renderStatus : RenderStatus = await pollRenderStatus(render.renderId, render.bucketName);

      if (renderStatus.status === 'failed') {
        logger.error("Audio render failed", { message: renderStatus.message });
        return { success: false, error: renderStatus.message };
      }

      if (renderStatus.status === 'completed' && renderStatus.videoUrl) {
        logger.log("Audio export completed", { 
          audioUrl: renderStatus.videoUrl,
          costs: renderStatus.costs
        });
        
        return { success: true, audioUrl: renderStatus.videoUrl, costs: renderStatus.costs };
      }

      logger.info('Cost infra', { costInCents: ctx.run.costInCents });
    } catch (error : any) {
      logger.error('Erreur lors de l\'export audio:', error);
      throw error;
    }
  },
});

const pollRenderStatus = async (renderId: string, bucketName: string) => {
  let attempts = 0;
  const maxAttempts = 500;
  const delayBetweenAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const renderStatus : RenderStatus = await getProgress(renderId, bucketName)

      if (renderStatus.status === 'processing' && renderStatus.progress) {
        await metadata.replace({
          status: 'processing',
          step: 'render-audio',
          progress: renderStatus.progress
        })
      } else if (renderStatus.status === 'completed' && renderStatus.videoUrl) {
        await metadata.replace({
          status: 'completed',
          audioUrl: renderStatus.videoUrl
        })
        return renderStatus;
      } else if (renderStatus.status === 'failed') {
        return renderStatus;
      }

      await wait.for({ seconds: delayBetweenAttempts });
      attempts++;
    } catch (error) {
      logger.error(`Error while getting audio render status: ${error}`);
      await wait.for({ seconds: delayBetweenAttempts });
      attempts++;
    }
  }

  throw new Error('Nombre maximum de tentatives atteint sans obtenir un statut "done" pour le rendu audio.');
}; 