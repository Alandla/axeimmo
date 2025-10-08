import { logger, metadata, task, wait } from "@trigger.dev/sdk";
import { updateExport } from "../dao/exportDao";
import { getVideoById, updateVideo } from "../dao/videoDao";
import { getProgress, renderVideo, renderAudio } from "../lib/render";
import { uploadImageFromUrlToS3, uploadVideoFromUrlToS3, uploadToS3Audio } from "../lib/r2";
import { IVideo } from "../types/video";
import { addCreditsToSpace, removeCreditsToSpace, updateSpaceLastUsed, getSpaceById } from "../dao/spaceDao";
import { IExport } from "../types/export";
import { generateAvatarVideo, getVideoDetails, uploadImageToHeygen, generateAvatarIVVideo } from "../lib/heygen";
import { calculateHeygenCost } from "../lib/cost";
import { addVideoExportedContact, sendExportedVideoEmail } from "../lib/loops";
import UserModel from "../models/User";
import { MixpanelEvent } from "../types/events";
import { track } from "../utils/mixpanel-server";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import fetch from "node-fetch";
import { Readable } from "node:stream";
import os from "os";
import path from "path";

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
  model?: 'heygen' | 'heygen-iv'
}

interface AvatarRenderData {
  audioIndex: number
  audioUrl: string
  start?: number
  end?: number
  startInFrames: number
  durationInSeconds: number
  heygenVideoId?: string
  firstWordStart?: number
  lastWordEnd?: number
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
      const model = payload.model || 'heygen'; // Default to 'heygen' if not specified
      let renderAudioCost = 0;
      let avatarCost = 0;

      logger.log("Exporting video...");
      const exportData : IExport = await updateExport(exportId, { runId: ctx.run.id, status: 'processing' });

      logger.log("Export data", { exportData });

      const video : IVideo | null = await getVideoById(videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      const createEvent = video.history?.find((h: { step: string }) => h.step === 'CREATE');
      const wasCreatedViaAPI = !createEvent?.user;

      if (ctx.attempt.number === 1) {

        if (!wasCreatedViaAPI) {
          await removeCreditsToSpace(exportData.spaceId, exportData.creditCost);
        }
        
        updateSpaceLastUsed(video.spaceId, undefined, undefined, video.video?.subtitle.name, video.settings, video.video?.format)
      }

      const space = await getSpaceById(video.spaceId);
      const showWatermark = space.plan.name === "FREE";

      // Récupérer les données du logo depuis le space
      const logoData = space.logo ? {
        url: space.logo.url,
        position: space.logo.position,
        show: space.logo.show,
        size: space.logo.size
      } : undefined;

      // Intégration de l'export audio si un avatar est présent
      if (video.video?.avatar?.id && video.video?.audio?.voices && ctx.attempt.number === 1) {
        
        if (model === 'heygen-iv') {
          // New model: generate multiple avatar videos for each visible segment
          logger.log("Using heygen-iv model - generating avatar render list...");
          
          const avatarRenderList = generateAvatarRenderList(video);
          logger.log(`Generated ${avatarRenderList.length} avatar renders`, { avatarRenderList });
          
          if (avatarRenderList.length > 0) {
            // Trim audios in parallel
            const trimmedAvatarRenders = await trimAvatarAudios(avatarRenderList);
            logger.log("Avatar audios trimmed", { trimmedAvatarRenders });
            
            // Upload avatar thumbnail to Heygen
            logger.log("Uploading avatar thumbnail to Heygen...");
            const imageKey = await uploadImageToHeygen(video.video.avatar.thumbnail!);
            logger.log("Avatar thumbnail uploaded", { imageKey });
            
            // Generate all avatar videos in batches of 3 with 1 second delay between batches
            logger.log("Starting avatar IV video generation for all segments...");
            const avatarRendersWithVideoIds: Array<AvatarRenderData & { heygenVideoId: string }> = [];
            const batchSize = 3;
            
            for (let i = 0; i < trimmedAvatarRenders.length; i += batchSize) {
              const batch = trimmedAvatarRenders.slice(i, i + batchSize);
              logger.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} videos)...`);
              
              const batchPromises = batch.map(async (render, batchIndex) => {
                const globalIndex = i + batchIndex;
                try {
                  const title = `${video.title || 'Video'} - Avatar ${globalIndex + 1}`;
                  const response = await generateAvatarIVVideo(
                    imageKey,
                    render.audioUrl,
                    video.video?.format,
                    title
                  );
                  logger.log(`Avatar IV video ${globalIndex + 1} generation started`, { heygenVideoId: response.data.video_id });
                  return {
                    ...render,
                    heygenVideoId: response.data.video_id
                  };
                } catch (error) {
                  logger.error(`Error generating avatar IV video ${globalIndex + 1}`, { error });
                  throw error;
                }
              });
              
              const batchResults = await Promise.all(batchPromises);
              avatarRendersWithVideoIds.push(...batchResults);
              
              // Wait 1 second before next batch (except for the last batch)
              if (i + batchSize < trimmedAvatarRenders.length) {
                logger.log("Waiting 1 second before next batch...");
                await wait.for({ seconds: 1 });
              }
            }
            logger.log("All avatar IV video generations started", { avatarRendersWithVideoIds });
            
            // Poll each avatar video status with sequential waits (no parallel waits allowed)
            logger.log("Polling avatar video statuses...");
            
            const pendingAvatars = new Map(
              avatarRendersWithVideoIds.map(render => [render.heygenVideoId!, render])
            );
            const completedAvatars = new Map<string, string>(); // videoId -> videoUrl
            const finalAvatarRenders: { audioIndex: number; startInFrames: number; url: string }[] = [];
            
            let attempts = 0;
            const maxAttempts = 200; // 200 * 6s = 1200s = 20min max
            
            // Poll with sequential waits
            while (pendingAvatars.size > 0 && attempts < maxAttempts) {
              attempts++;
              // Check all pending avatars status in parallel (no wait here)
              const statusChecks = Array.from(pendingAvatars.keys()).map(async (videoId) => {
                try {
                  const status = await getVideoDetails(videoId);
                  return { videoId, status };
                } catch (error) {
                  logger.error(`Error checking status for avatar ${videoId}:`, { error });
                  return { videoId, status: { data: { status: 'failed', error } } };
                }
              });
              
              // Wait for all status checks to complete
              const allStatuses = await Promise.all(statusChecks);
              
              // Process completed avatars
              for (const { videoId, status } of allStatuses) {
                const render = pendingAvatars.get(videoId);
                if (!render) continue;
                
                if (status.data.status === 'completed' && status.data.video_url) {
                  logger.log(`Avatar video ${videoId} completed`, { videoUrl: status.data.video_url });
                  logger.log("status.data", status.data);
                  completedAvatars.set(videoId, status.data.video_url);
                  pendingAvatars.delete(videoId);
                } else if (status.data.status === 'failed') {
                  logger.error(`Avatar video ${videoId} failed`, { error: status.data.error });
                  pendingAvatars.delete(videoId);
                  throw new Error(`Avatar video generation failed: ${status.data.error}`);
                }
              }
              
              // If there are still pending avatars, wait before next check
              if (pendingAvatars.size > 0) {
                await wait.for({ seconds: 6 });
              }
            }
            
            // Check if we timed out
            if (pendingAvatars.size > 0) {
              throw new Error(`Timeout: ${pendingAvatars.size} avatar(s) did not complete after ${maxAttempts * 6} seconds`);
            }
            
            // Upload all completed avatars to R2 in parallel
            logger.log("Uploading completed avatars to R2...");
            const uploadPromises = Array.from(completedAvatars.entries()).map(async ([videoId, videoUrl]) => {
              const render = avatarRendersWithVideoIds.find(r => r.heygenVideoId === videoId);
              if (!render) return null;
              
              try {
                const fileName = `avatar-iv-${video.id}-${render.audioIndex}-${Date.now()}`;
                const r2VideoUrl = await uploadVideoFromUrlToS3(videoUrl, "medias-users", fileName);
                logger.log(`Avatar ${render.audioIndex} uploaded to R2`, { r2VideoUrl });
                
                return {
                  audioIndex: render.audioIndex,
                  startInFrames: render.startInFrames,
                  url: r2VideoUrl
                };
              } catch (error) {
                logger.error(`Error uploading avatar ${render.audioIndex} to R2`, { error });
                throw error;
              }
            });
            
            const uploadResults = await Promise.all(uploadPromises);
            finalAvatarRenders.push(...uploadResults.filter(r => r !== null) as typeof finalAvatarRenders);
            
            // Sort renders by startInFrames to ensure correct z-index order (first appearance comes first)
            finalAvatarRenders.sort((a, b) => a.startInFrames - b.startInFrames);
            
            logger.log("All avatar videos completed and uploaded", { finalAvatarRenders });
            
            // Calculate total avatar cost for IV model
            const totalAvatarDuration = trimmedAvatarRenders.reduce((sum, render) => sum + render.durationInSeconds, 0);
            avatarCost = calculateHeygenCost(totalAvatarDuration, 'heygen-iv');
            logger.log("Avatar IV cost calculated", { totalAvatarDuration, avatarCost });
            
            // Store the final renders in the video avatar object
            if (!video.video.avatar) {
              video.video.avatar = {} as any;
            }
            
            if (video.video.avatar) {
              video.video.avatar.renders = finalAvatarRenders;
              await updateVideo(video);
              logger.log("Avatar renders saved to video", { renders: video.video.avatar.renders });
            }
          }
        } else {
          // Original model: generate one complete avatar video
          logger.log("Using heygen model - combining audios...");
          
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
          const avatarResponse = await generateAvatarVideo(video.video.avatar, audioRenderStatus.url || '', video.video.format);

          logger.log("Avatar response", { avatarResponse });
          const avatarVideoUrl = await pollAvatarVideoStatus(avatarResponse.data.video_id);
          
          logger.log("Avatar video response", { avatarVideoUrl });

          if (avatarVideoUrl) {
            avatarCost = calculateHeygenCost(video.video.metadata.audio_duration, 'heygen');
            
            // Upload the avatar video to R2 instead of using Heygen's temporary URL
            logger.log("Uploading avatar video to R2...");
            const fileName = `avatar-${video.id}-${Date.now()}`;
            const r2VideoUrl = await uploadVideoFromUrlToS3(avatarVideoUrl, "medias-users", fileName);
            
            video.video.avatar.videoUrl = r2VideoUrl;
            logger.log("Avatar video uploaded to R2", { r2VideoUrl });
            await updateVideo(video);
          }
        }
      }

      const render = await renderVideo(video, showWatermark, ctx.attempt.number === 2 ? 4096 : 2048, logoData);
      await updateExport(exportId, { renderId: render.renderId, bucketName: render.bucketName, status: 'processing', costAvatar: avatarCost });

      const renderStatus : RenderStatus = await pollRenderStatus(
        render.renderId, 
        render.bucketName,
        'render',
        ctx.attempt.number === 2 ? 4096 : 2048
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
          
          if (!wasCreatedViaAPI) {
            await addCreditsToSpace(video.spaceId, exportData.creditCost);
          }
          await metadata.replace({
            status: 'failed',
            errorMessage: renderStatus.message || 'Render failed'
          })
          throw new Error(renderStatus.message || 'Render failed');
        }
      }

      if (renderStatus.status === 'completed' && renderStatus.url && renderStatus.costs) {
        const exportRenderCost = renderStatus.costs + (ctx.run.baseCostInCents || 0) + renderAudioCost;
        const videoCostToGenerate = video.costToGenerate || 0;
        const totalCost = avatarCost + exportRenderCost + videoCostToGenerate;
        
        await updateExport(exportId, { 
          downloadUrl: renderStatus.url, 
          renderCost: exportRenderCost,
          costTotal: totalCost,
          status: 'completed' 
        });
        await metadata.replace({
          status: 'completed',
          downloadUrl: renderStatus.url,
          creditCost: wasCreatedViaAPI ? 0 : exportData.creditCost
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
                    userName: (user.firstName || '').split(' ')[0],
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

      logger.info('Cost infra', { costInCents: ctx.run.baseCostInCents });
    } catch (error : any) {
      logger.error('Erreur lors de l\'export:', error);
      throw error;
    }
  },
});

// Trim audio function extracted from trim-audio task to avoid cold start
const trimAudioLocal = async (audioUrl: string, start?: number, end?: number, retryCount: number = 0): Promise<{ audioUrl: string; size: number; duration?: number; startTime: number }> => {
  const maxRetries = 3;
  const startTime = start || 0;
  const tempDirectory = os.tmpdir();
  const outputPath = path.join(tempDirectory, `trimmed_audio_${Date.now()}_${retryCount}.wav`);

  try {
    logger.log("Fetching audio from URL", { audioUrl, start: startTime, end, retryCount });
    const response = await fetch(audioUrl);

    if (!response.body) {
      throw new Error("Failed to fetch audio");
    }

    await new Promise((resolve, reject) => {
      const command = ffmpeg(Readable.from(response.body as any));

      // Seek to start position (before input for faster processing)
      if (startTime > 0) {
        command.seekInput(startTime);
      }

      // Use WAV PCM for perfect sample-accurate synchronization
      command.outputOptions([
        "-c:a pcm_s16le", // PCM 16-bit signed little-endian (no compression, no delay)
        "-ar 44100", // Sample rate 44.1 kHz
        "-ac 2", // Stereo
        "-avoid_negative_ts make_zero"
      ]);

      // Set end time if specified
      if (end !== undefined && end > startTime) {
        command.duration(end - startTime);
      }

      command
        .output(outputPath)
        .on("end", () => {
          logger.log("Audio trimming completed", { outputPath });
          resolve(true);
        })
        .on("error", (err) => {
          logger.error("FFmpeg error", { error: err.message });
          reject(err);
        })
        .run();
    });

    const trimmedAudio = await fs.readFile(outputPath);
    const audioSize = trimmedAudio.length;

    logger.log(`Trimmed audio size: ${audioSize} bytes`);

    const uploadedAudioUrl = await uploadToS3Audio(trimmedAudio, 'medias-users');
    
    logger.log("Audio uploaded to R2", { audioUrl: uploadedAudioUrl });

    // Check if file exists before deleting
    try {
      await fs.access(outputPath);
      await fs.unlink(outputPath);
      logger.log("Temporary file deleted", { outputPath });
    } catch (unlinkError) {
      logger.warn("Could not delete temporary file (may not exist)", { outputPath, error: unlinkError });
    }

    return {
      audioUrl: uploadedAudioUrl,
      size: audioSize,
      duration: end ? end - startTime : undefined,
      startTime: startTime,
    };
  } catch (error) {
    logger.error("Error in trimAudioLocal", { error, retryCount, audioUrl });
    
    // Clean up the output file if it exists
    try {
      await fs.access(outputPath);
      await fs.unlink(outputPath);
      logger.log("Cleaned up temporary file after error", { outputPath });
    } catch (cleanupError) {
      // File doesn't exist, no need to clean up
    }

    // Retry if we haven't exceeded max retries
    if (retryCount < maxRetries) {
      logger.log(`Retrying audio trim (attempt ${retryCount + 1}/${maxRetries})...`);
      await wait.for({ seconds: 2 });
      return trimAudioLocal(audioUrl, start, end, retryCount + 1);
    }
    
    throw error;
  }
};

// Generate list of avatar renders needed for heygen-iv model
const generateAvatarRenderList = (video: IVideo): AvatarRenderData[] => {
  if (!video.video?.sequences || !video.video?.audio?.voices) {
    return [];
  }

  const avatarRenders: AvatarRenderData[] = [];
  const sequences = video.video.sequences;
  const voices = video.video.audio.voices;

  let currentRender: AvatarRenderData | null = null;
  let lastSequenceIndexInRender: number | null = null;

  for (let i = 0; i < sequences.length; i++) {
    const sequence = sequences[i];
    const showAvatar = sequence.media?.show === 'hide' || sequence.media?.show === 'half';

    if (showAvatar) {
      // Find the corresponding voice
      const voice = voices.find(v => v.index === sequence.audioIndex);
      if (!voice) continue;

      // Check if we should continue the current render or start a new one
      const shouldContinue = currentRender && 
                            lastSequenceIndexInRender === i - 1 && 
                            currentRender.audioIndex === sequence.audioIndex;

      if (!shouldContinue) {
        // Save previous render if exists
        if (currentRender) {
          avatarRenders.push(currentRender);
        }

        // Calculate startInFrames: sum of all durationInFrames of voices before this audioIndex
        let startInFrames = 0;
        for (const v of voices) {
          if (v.index < sequence.audioIndex) {
            startInFrames += v.durationInFrames;
          } else {
            break;
          }
        }

        // Check if this is the first sequence of this audioIndex
        const firstSequenceOfAudio = sequences.find(s => s.audioIndex === sequence.audioIndex);
        const isFirstOfAudioIndex = firstSequenceOfAudio && sequences.indexOf(firstSequenceOfAudio) === i;

        // Calculate start time (if not the first sequence of this audioIndex)
        let start: number | undefined = undefined;
        let firstWordStart: number | undefined = undefined;
        
        if (!isFirstOfAudioIndex) {
          // Not the first sequence, find the last word of previous sequence
          const prevSequence = sequences[i - 1];
          if (prevSequence.words && prevSequence.words.length > 0) {
            const lastWord = prevSequence.words[prevSequence.words.length - 1];
            start = lastWord.start - voice.start;
            firstWordStart = lastWord.start; // Use the start timestamp of this word
            
            // Add startOffset if present
            if (voice.startOffset) {
              start += voice.startOffset;
            }
          }

          // Add durationInFrames of all words from the start of this audioIndex until the previous sequence
          // But exclude the last word of the previous sequence (where we start cutting)
          for (let j = 0; j < i; j++) {
            const prevSeq = sequences[j];
            if (prevSeq.audioIndex === sequence.audioIndex && prevSeq.words) {
              // If this is the sequence right before (i-1), exclude the last word
              if (j === i - 1) {
                for (let k = 0; k < prevSeq.words.length - 1; k++) {
                  startInFrames += prevSeq.words[k].durationInFrames;
                }
              } else {
                // For other sequences, add all words
                for (const word of prevSeq.words) {
                  startInFrames += word.durationInFrames;
                }
              }
            }
          }
        } else {
          // First sequence of this audioIndex, use the first word of current sequence
          if (sequence.words && sequence.words.length > 0) {
            firstWordStart = sequence.words[0].start;
          }
        }

        // Create new render (duration will be calculated later when we know the end)
        currentRender = {
          audioIndex: sequence.audioIndex,
          audioUrl: voice.url,
          start,
          startInFrames,
          durationInSeconds: 0, // Will be calculated later
          firstWordStart
        };
      }

      // Update lastWordEnd with the last word of current sequence
      if (currentRender && sequence.words && sequence.words.length > 0) {
        currentRender.lastWordEnd = sequence.words[sequence.words.length - 1].end;
      }

      lastSequenceIndexInRender = i;

      // Check if we need to set end time (if next sequence doesn't show avatar or has different audioIndex)
      const nextSequence = sequences[i + 1];
      const isLastSequenceOfRender = !nextSequence || 
                                     nextSequence.media?.show !== 'hide' && nextSequence.media?.show !== 'half' ||
                                     nextSequence.audioIndex !== sequence.audioIndex;

      if (isLastSequenceOfRender && currentRender) {
        // Calculate end time if not the last sequence of this audioIndex
        const lastSequenceOfAudio = sequences.filter(s => s.audioIndex === sequence.audioIndex).pop();
        if (lastSequenceOfAudio && sequences.indexOf(lastSequenceOfAudio) !== i && nextSequence) {
          if (nextSequence.words && nextSequence.words.length > 0) {
            const firstWord = nextSequence.words[0];
            currentRender.end = firstWord.end - voice.start;
            
            // Add startOffset if present
            if (voice.startOffset) {
              currentRender.end += voice.startOffset;
            }
            
            // Update lastWordEnd with the end of the first word of next sequence
            currentRender.lastWordEnd = firstWord.end;
          }
        }
        
        // Calculate duration in seconds based on actual word timestamps
        if (currentRender.firstWordStart !== undefined && currentRender.lastWordEnd !== undefined) {
          currentRender.durationInSeconds = currentRender.lastWordEnd - currentRender.firstWordStart;
        }
        
        // Clean up temporary properties before saving
        delete currentRender.firstWordStart;
        delete currentRender.lastWordEnd;
        
        avatarRenders.push(currentRender);
        currentRender = null;
        lastSequenceIndexInRender = null;
      }
    } else {
      // Avatar is hidden, save current render if exists
      if (currentRender) {
        // Calculate duration in seconds based on actual word timestamps
        if (currentRender.firstWordStart !== undefined && currentRender.lastWordEnd !== undefined) {
          currentRender.durationInSeconds = currentRender.lastWordEnd - currentRender.firstWordStart;
        }
        
        // Clean up temporary properties before saving
        delete currentRender.firstWordStart;
        delete currentRender.lastWordEnd;
        
        avatarRenders.push(currentRender);
        currentRender = null;
        lastSequenceIndexInRender = null;
      }
    }
  }

  // Save last render if exists
  if (currentRender) {
    // Calculate duration in seconds based on actual word timestamps
    if (currentRender.firstWordStart !== undefined && currentRender.lastWordEnd !== undefined) {
      currentRender.durationInSeconds = currentRender.lastWordEnd - currentRender.firstWordStart;
    }
    
    // Clean up temporary properties before saving
    delete currentRender.firstWordStart;
    delete currentRender.lastWordEnd;
    
    avatarRenders.push(currentRender);
  }

  return avatarRenders;
};

// Trim avatars audios in parallel
const trimAvatarAudios = async (avatarRenders: AvatarRenderData[]): Promise<AvatarRenderData[]> => {
  logger.log(`Trimming ${avatarRenders.length} avatar audios in parallel...`);
  
  const trimPromises = avatarRenders.map(async (render) => {
    // Only trim if we have start or end defined
    if (render.start !== undefined || render.end !== undefined) {
      try {
        const trimResult = await trimAudioLocal(render.audioUrl, render.start, render.end);
        return {
          ...render,
          audioUrl: trimResult.audioUrl
        };
      } catch (error) {
        logger.error(`Error trimming audio for audioIndex ${render.audioIndex}`, { error });
        throw error;
      }
    }
    // No trimming needed, return as is
    return render;
  });

  const trimmedRenders = await Promise.all(trimPromises);
  logger.log("All avatar audios trimmed successfully");
  
  return trimmedRenders;
};

const pollRenderStatus = async (renderId: string, bucketName: string, step: string = 'render', memorySizeInMb: number = 2048) => {
  let attempts = 0;
  const maxAttempts = step === 'render' ? 1000 : 500;
  const delayBetweenAttempts = 6;

  while (attempts < maxAttempts) {
    try {
      const renderStatus = await getProgress(renderId, bucketName, step === 'render-audio', memorySizeInMb);

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