import { logger, metadata, task, wait } from "@trigger.dev/sdk";
import { updateExport } from "../dao/exportDao";
import { getVideoById, updateVideo } from "../dao/videoDao";
import { getProgress, renderVideo, renderAudio } from "../lib/render";
import { uploadImageFromUrlToS3 } from "../lib/r2";
import { IVideo } from "../types/video";
import { addCreditsToSpace, removeCreditsToSpace, updateSpaceLastUsed, getSpaceById } from "../dao/spaceDao";
import { IExport } from "../types/export";
import { generateAvatarVideo, getVideoDetails } from "../lib/heygen";
import { calculateHeygenCost } from "../lib/cost";
import { addVideoExportedContact, sendExportedVideoEmail } from "../lib/loops";
import UserModel from "../models/User";
import { MixpanelEvent } from "../types/events";
import { track } from "../utils/mixpanel-server";

interface RenderStatus {
  status: string;
  progress?: number;
  url?: string | null;
  costs?: number;
  message?: string;
}

interface ExportVideoPayload {
  videoId: string
  exportId: string
}


export const exportVideoTask = task({
  id: "export-video",
  maxDuration: 600,
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: ExportVideoPayload, { ctx }) => {
    try {
      const videoId = payload.videoId;
      const exportId = payload.exportId;
      let renderAudioCost = 0;

      logger.log("Exporting video...");
      const exportData : IExport = await updateExport(exportId, { runId: ctx.run.id, status: 'processing' });

      logger.log("Export data", { exportData });

      const video : IVideo | null = await getVideoById(videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      if (ctx.attempt.number === 1) {
        await removeCreditsToSpace(exportData.spaceId, exportData.creditCost);
        updateSpaceLastUsed(video.spaceId, undefined, undefined, video.video?.subtitle.name, video.settings)
      }

      const space = await getSpaceById(video.spaceId);
      const showWatermark = space.plan.name === "FREE";

      // Intégration de l'export audio si un avatar est présent
      if (video.video?.avatar?.id && video.video?.audio?.voices && ctx.attempt.number === 1) {
        logger.log("Combinaison des audios...");
        
        // Render audio only
        const audioRender = await renderAudio(video);
        logger.log("Audio render started", { renderId: audioRender.renderId, bucketName: audioRender.bucketName });

        const audioRenderStatus : RenderStatus = await pollRenderStatus(
          audioRender.renderId, 
          audioRender.bucketName,
          'render-audio'
        );

        if (audioRenderStatus.status === 'failed') {
          throw new Error('La combinaison des audios a échoué');
        }

        renderAudioCost = audioRenderStatus.costs || 0;

        logger.log("Génération de la vidéo avatar...");
        const avatarResponse = await generateAvatarVideo(video.video.avatar, audioRenderStatus.url || '');

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

      const render = await renderVideo(video, showWatermark);
      await updateExport(exportId, { renderId: render.renderId, bucketName: render.bucketName, status: 'processing' });

      const renderStatus : RenderStatus = await pollRenderStatus(
        render.renderId, 
        render.bucketName,
        'render'
      );

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
          throw new Error(renderStatus.message || 'Render failed');
        }
      }

      if (renderStatus.status === 'completed' && renderStatus.url && renderStatus.costs) {
        await updateExport(exportId, { 
          downloadUrl: renderStatus.url, 
          renderCost: renderStatus.costs + ctx.run.costInCents + renderAudioCost, 
          status: 'completed' 
        });
        await metadata.replace({
          status: 'completed',
          downloadUrl: renderStatus.url,
          renderCost: renderStatus.costs + ctx.run.costInCents + renderAudioCost
        })

        try {
          logger.info('Sending emails to space users');
          const createEvent = video.history?.find((h: { step: string }) => h.step === 'CREATE');
          const userId = createEvent?.user;

          track(MixpanelEvent.VIDEO_EXPORTED, {
            distinct_id: userId,
            videoId: video.id,
            hasAvatar: video.video?.avatar ? true : false,
          })

          const space = await getSpaceById(video.spaceId);
          
          if (space && space.members && space.members.length > 0) {
            const userIds = space.members.map((member: any) => member.userId);
            const users = await UserModel.find({ _id: { $in: userIds } });
            
            if (users && users.length > 0) {
              const emailPromises = users.map(async (user: any) => {
                if (user.email) {
                  sendExportedVideoEmail({
                    email: user.email,
                    userName: (user.name || '').split(' ')[0],
                    videoName: video.title || '',
                    thumbnailUrl: video.video?.thumbnail || '',
                    exportId
                  });
                  return addVideoExportedContact(user.id);
                }
                return null;
              });
              await Promise.all(emailPromises);
              logger.info('Mails sent successfully');
            } else {
              logger.warn('No user found for this space');
            }
          } else {
            logger.warn('Space not found or no members in the space');
          }
        } catch (emailError) {
          const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
          logger.error('Error while sending emails', { error: errorMessage });
        }
        
        return { success: true, url: renderStatus.url };
      }

      logger.info('Cost infra', { costInCents: ctx.run.costInCents });
    } catch (error : any) {
      logger.error('Erreur lors de l\'export:', error);
      throw error;
    }
  },
});

const pollRenderStatus = async (renderId: string, bucketName: string, step: string = 'render') => {
  let attempts = 0;
  const maxAttempts = step === 'render' ? 1000 : 500;
  const delayBetweenAttempts = 6;

  while (attempts < maxAttempts) {
    try {
      const renderStatus = await getProgress(renderId, bucketName, step === 'render-audio');

      if (renderStatus.status === 'processing' && renderStatus.progress) {
        await metadata.replace({
          status: 'processing',
          step: step,
          progress: renderStatus.progress
        })
      } else if (renderStatus.status === 'completed' && renderStatus.url) {
        return renderStatus;
      } else if (renderStatus.status === 'failed') {
        return renderStatus;
      }

      await wait.for({ seconds: delayBetweenAttempts });
      attempts++;
    } catch (error) {
      logger.error(`Error while getting ${step} status: ${error}`);
      await wait.for({ seconds: delayBetweenAttempts });
      attempts++;
    }
  }

  throw new Error(`Nombre maximum de tentatives atteint sans obtenir un statut "done" pour le ${step}.`);
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
  const delayBetweenAttempts = 6;

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