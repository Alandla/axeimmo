import { logger, metadata, task, wait } from "@trigger.dev/sdk/v3";
import { updateExport } from "../dao/exportDao";
import { getVideoById, updateVideo } from "../dao/videoDao";
import { getProgress, renderVideo } from "../lib/render";
import { uploadImageFromUrlToS3 } from "../lib/r2";
import { IVideo } from "../types/video";
import { addCreditsToSpace, removeCreditsToSpace } from "../dao/spaceDao";
import { IExport } from "../types/export";
import { generateAvatarVideo, getVideoDetails } from "../lib/heygen";
import { calculateHeygenCost } from "../lib/cost";

interface RenderStatus {
  status: string;
  progress?: number;
  videoUrl?: string | null;
  costs?: number;
  message?: string;
}

interface ExportVideoPayload {
  videoId: string
  exportId: string
}

export const exportVideoTask = task({
  id: "export-video",
  maxDuration: 300,
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: ExportVideoPayload, { ctx }) => {
    try {
      const videoId = payload.videoId;
      const exportId = payload.exportId;

      logger.log("Exporting video...");
      const exportData : IExport = await updateExport(exportId, { runId: ctx.run.id, status: 'processing' });

      logger.log("Export data", { exportData });

      if (ctx.attempt.number === 1) {
        await removeCreditsToSpace(exportData.spaceId, exportData.creditCost);
      }

      const video = await getVideoById(videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      if (video.video?.avatar?.id && video.video?.audio?.url && !video.video?.avatar?.videoUrl) {
        logger.log("Génération de la vidéo avatar...");
        const avatarResponse = await generateAvatarVideo(video.video.avatar, video.video.audio?.url);
        logger.log("Avatar response", { avatarResponse });
        const avatarVideoUrl = await pollAvatarVideoStatus(avatarResponse.data.video_id);
        logger.log("Avatar video response", { avatarVideoUrl });

        if (avatarVideoUrl) {
          const cost = calculateHeygenCost(video.video.metadata.audio_duration);
          video.costToGenerate = (video.costToGenerate || 0) + cost;
          video.video.avatar.videoUrl = avatarVideoUrl;
          await updateVideo(video);
        }
      }

      const render = await renderVideo(video);
      await updateExport(exportId, { renderId: render.renderId, bucketName: render.bucketName, status: 'processing' });

      const renderStatus : RenderStatus = await pollRenderStatus(render.renderId, render.bucketName);

      if (renderStatus.status === 'failed') {
        if (ctx.attempt.number === 1) {
          // Première tentative échouée : upload des images et réessai
          await uploadGoogleImagesToS3(video);
          logger.log("Error", { message: renderStatus.message });
          throw new Error('Premier échec du rendu - Réessai après upload des images');
        } else {
          // Deuxième tentative échouée : on arrête avec l'erreur
          const exportData : IExport = await updateExport(exportId, { 
            status: 'failed',
            errorMessage: renderStatus.message || 'Render failed'
          });
          await addCreditsToSpace(video.spaceId, exportData.creditCost);
          await metadata.replace({
            status: 'failed',
            errorMessage: renderStatus.message || 'Render failed'
          })
          return { success: false, error: renderStatus.message };
        }
      }

      if (renderStatus.status === 'completed' && renderStatus.videoUrl && renderStatus.costs) {
        await updateExport(exportId, { 
          downloadUrl: renderStatus.videoUrl, 
          renderCost: renderStatus.costs + ctx.run.costInCents, 
          status: 'completed' 
        });
        await metadata.replace({
          status: 'completed',
          downloadUrl: renderStatus.videoUrl,
          renderCost: renderStatus.costs + ctx.run.costInCents
        })
        return { success: true, videoUrl: renderStatus.videoUrl };
      }

      logger.info('Cost infra', { costInCents: ctx.run.costInCents });
    } catch (error : any) {
      logger.error('Erreur lors de l\'export:', error);
      throw error;
    }
  },
});

const pollRenderStatus = async (renderId: string, bucketName: string) => {
  let attempts = 0;
  const maxAttempts = 1000;
  const delayBetweenAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const renderStatus : RenderStatus = await getProgress(renderId, bucketName)

      if (renderStatus.status === 'processing' && renderStatus.progress) {
        await metadata.replace({
          status: 'processing',
          step: 'render',
          progress: renderStatus.progress
        })
      } else if (renderStatus.status === 'completed' && renderStatus.videoUrl && renderStatus.costs) {
        await metadata.replace({
          status: 'completed',
          videoUrl: renderStatus.videoUrl,
          costs: renderStatus.costs
        })
        return renderStatus;
      } else if (renderStatus.status === 'failed') {
        return renderStatus;
      }

      await wait.for({ seconds: delayBetweenAttempts });
      attempts++;
    } catch (error) {
      logger.error(`Error while getting transcription status: ${error}`);
      await wait.for({ seconds: delayBetweenAttempts });
      attempts++;
    }
  }

  throw new Error('Nombre maximum de tentatives atteint sans obtenir un statut "done" pour le rendu.');
};

const uploadGoogleImagesToS3 = async (video: IVideo) => {
  if (video && video.video) {
    for (const sequence of video.video.sequences) {
      if (sequence.media?.type === "image" && !sequence.media?.image?.link.startsWith('https://media.hoox.video/') && sequence.media?.image?.link) {
        try {
          const fileName = `image-${Date.now()}`;
          const s3Url = await uploadImageFromUrlToS3(sequence.media?.image?.link, "medias-users", fileName);

          if (sequence.media && sequence.media.image) {
            sequence.media.image.link = s3Url;
          }
        } catch (error) {
          console.log(error)
          console.error('Erreur lors de l\'upload de l\'image sur S3:', error);
        }
      }
    }
    await updateVideo(video);
  }
  return video;
}

async function pollAvatarVideoStatus(videoId: string): Promise<string> {
  let attempts = 0;
  const maxAttempts = 1000;
  const delayBetweenAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const status = await getVideoDetails(videoId);
      logger.log("Avatar status", { status });
      if (status.data.status === 'completed' && status.data.video_url) {
        return status.data.video_url;
      } else if (status.data.status === 'failed') {
        logger.error('La génération de la vidéo avatar a échoué', { error: status.data.error });
        throw new Error('La génération de la vidéo avatar a échoué');
      }

      await metadata.replace({
        status: 'processing',
        step: 'avatar',
        progress: attempts
      })

      await wait.for({ seconds: delayBetweenAttempts });
      attempts++;
    } catch (error) {
      logger.error(`Erreur lors de la vérification du statut de la vidéo avatar: ${error}`);
      await wait.for({ seconds: delayBetweenAttempts });
      attempts++;
    }
  }

  throw new Error('Timeout lors de la génération de la vidéo avatar');
}