import { logger, metadata, task, wait } from "@trigger.dev/sdk";
import { updateExport } from "../dao/exportDao";
import { getVideoById, updateVideo } from "../dao/videoDao";
import { getProgress, renderVideo, renderAudio } from "../lib/render";
import { uploadImageFromUrlToS3, uploadVideoFromUrlToS3, uploadToS3Audio } from "../lib/r2";
import { IVideo, ISequence } from "../types/video";
import { addCreditsToSpace, removeCreditsToSpace, updateSpaceLastUsed, getSpaceById } from "../dao/spaceDao";
import { IExport } from "../types/export";
import { generateAvatarVideo, getVideoDetails, uploadImageToHeygen, generateAvatarIVVideo } from "../lib/heygen";
import { calculateHeygenCost, calculateOmniHumanCost, calculateVeo3Cost, calculateElevenLabsCost } from "../lib/cost";
import { startOmniHumanVideoGeneration, checkOmniHumanRequestStatus, getOmniHumanRequestResult, Veo3GenerationMode, startVeo3VideoGeneration, checkVeo3RequestStatus, getVeo3RequestResult } from "../lib/fal";
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
import { randomUUID } from "crypto";
import { generateAvatarRenderList, AvatarRenderData, generateVeo3RenderList } from "../lib/avatar-render";
import { voiceChangerFromVideo } from "../lib/elevenlabs";
import { getTranscription } from "../lib/transcription";
import { 
  getVeo3AspectRatio, 
  recreateSequencesFromVeo3Results,
  createAvatarRendersFromSequences,
  createVoicesFromResults
} from "../lib/veo3";
import veo3ResultArrayMock from "../test/mockup/veo3ResultArray.json";
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

interface AvatarRenderDataWithRequestId extends AvatarRenderData {
  requestId?: string
}

interface AvatarModelAdapter {
  modelName: string
  batchSize: number
  prepareImageResource: (thumbnail: string) => Promise<string>
  generateVideo: (imageResource: string, render: AvatarRenderData, video: IVideo, index: number) => Promise<string>
  checkStatus: (requestId: string) => Promise<{ status: 'completed' | 'failed' | 'processing', videoUrl?: string, error?: any }>
  calculateCost: (durationInSeconds: number) => number
  getFileNamePrefix: () => string
}

interface Veo3Result {
  audioIndex: number
  audioUrl: string
  videoUrl: string
  transcription: any
}

// Adapter for Heygen-IV model
const heygenIVAdapter: AvatarModelAdapter = {
  modelName: 'heygen-iv',
  batchSize: 3,
  prepareImageResource: async (thumbnail: string) => {
    logger.log("Uploading avatar thumbnail to Heygen...");
    const imageKey = await uploadImageToHeygen(thumbnail);
    logger.log("Avatar thumbnail uploaded", { imageKey });
    return imageKey;
  },
  generateVideo: async (imageKey: string, render: AvatarRenderData, video: IVideo, index: number) => {
    const title = `${video.title || 'Video'} - Avatar ${index + 1}`;
    const response = await generateAvatarIVVideo(
      imageKey,
      render.audioUrl,
      video.video?.format,
      title
    );
    return response.data.video_id;
  },
  checkStatus: async (videoId: string) => {
    const status = await getVideoDetails(videoId);
    if (status.data.status === 'completed' && status.data.video_url) {
      return { status: 'completed', videoUrl: status.data.video_url };
    } else if (status.data.status === 'failed') {
      return { status: 'failed', error: status.data.error };
    }
    return { status: 'processing' };
  },
  calculateCost: (durationInSeconds: number) => calculateHeygenCost(durationInSeconds, 'heygen-iv'),
  getFileNamePrefix: () => 'avatar-iv'
};

// Adapter for OmniHuman model
const omnihumanAdapter: AvatarModelAdapter = {
  modelName: 'omnihuman',
  batchSize: 50,
  prepareImageResource: async (thumbnail: string) => {
    logger.log("Using avatar thumbnail directly", { thumbnail });
    return thumbnail;
  },
  generateVideo: async (imageUrl: string, render: AvatarRenderData) => {
    const response = await startOmniHumanVideoGeneration({
      image_url: imageUrl,
      audio_url: render.audioUrl
    });
    return response.request_id;
  },
  checkStatus: async (requestId: string) => {
    const status = await checkOmniHumanRequestStatus(requestId);
    if (status.status === 'COMPLETED' && status.response_url) {
      const result = await getOmniHumanRequestResult(requestId);
      if (result.data?.video?.url) {
        return { status: 'completed', videoUrl: result.data.video.url };
      }
      throw new Error(`No video URL in OmniHuman result for ${requestId}`);
    } else if ((status as any).status === 'FAILED') {
      return { status: 'failed', error: (status as any).error };
    }
    return { status: 'processing' };
  },
  calculateCost: (durationInSeconds: number) => calculateOmniHumanCost(durationInSeconds),
  getFileNamePrefix: () => 'avatar-omnihuman'
};

// Common function to generate avatar videos with any model
async function generateAvatarVideosWithModel(
  adapter: AvatarModelAdapter,
  video: IVideo,
  trimmedAvatarRenders: AvatarRenderData[]
): Promise<{ renders: { audioIndex: number; startInFrames: number; durationInSeconds: number; url: string }[], cost: number }> {
  // Prepare image resource (upload for heygen-iv, direct URL for omnihuman)
  const imageResource = await adapter.prepareImageResource(video.video!.avatar!.thumbnail!);
  
  // Generate all avatar videos in batches
  logger.log(`Starting ${adapter.modelName} video generation for all segments...`);
  const avatarRendersWithRequestIds: Array<AvatarRenderDataWithRequestId & { requestId: string }> = [];
  const batchSize = adapter.batchSize;
  
  for (let i = 0; i < trimmedAvatarRenders.length; i += batchSize) {
    const batch = trimmedAvatarRenders.slice(i, i + batchSize);
    logger.log(`Processing batch ${Math.floor(i / batchSize) + 1} (${batch.length} videos)...`);
    
    const batchPromises = batch.map(async (render, batchIndex) => {
      const globalIndex = i + batchIndex;
      try {
        const requestId = await adapter.generateVideo(imageResource, render, video, globalIndex);
        logger.log(`${adapter.modelName} video ${globalIndex + 1} generation started`, { requestId });
        return {
          ...render,
          requestId
        };
      } catch (error) {
        logger.error(`Error generating ${adapter.modelName} video ${globalIndex + 1}`, { error });
        throw error;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    avatarRendersWithRequestIds.push(...batchResults);
    
    // Wait 1 second before next batch (except for the last batch)
    if (i + batchSize < trimmedAvatarRenders.length) {
      logger.log("Waiting 1 second before next batch...");
      await wait.for({ seconds: 1 });
    }
  }
  logger.log(`All ${adapter.modelName} video generations started`, { avatarRendersWithRequestIds });
  
  // Poll each avatar video status
  logger.log(`Polling ${adapter.modelName} avatar video statuses...`);
  
  const pendingAvatars = new Map(
    avatarRendersWithRequestIds.map(render => [render.requestId!, render])
  );
  const completedAvatars = new Map<string, string>(); // requestId -> videoUrl
  
  let attempts = 0;
  const maxAttempts = 200; // 200 * 6s = 1200s = 20min max
  const totalAvatars = avatarRendersWithRequestIds.length;
  let lastProgressSent = -1; // Track last progress percentage sent to avoid duplicate updates
  
  // Poll with sequential waits
  while (pendingAvatars.size > 0 && attempts < maxAttempts) {
    attempts++;
    // Check all pending avatars status in parallel
    const statusChecks = Array.from(pendingAvatars.keys()).map(async (requestId) => {
      try {
        const status = await adapter.checkStatus(requestId);
        return { requestId, status };
      } catch (error) {
        logger.error(`Error checking status for ${adapter.modelName} avatar ${requestId}:`, { error });
        return { requestId, status: { status: 'failed' as const, error } };
      }
    });
    
    // Wait for all status checks to complete
    const allStatuses = await Promise.all(statusChecks);
    
    // Process completed avatars
    for (const { requestId, status } of allStatuses) {
      const render = pendingAvatars.get(requestId);
      if (!render) continue;
      
      if (status.status === 'completed' && status.videoUrl) {
        logger.log(`${adapter.modelName} avatar video ${requestId} completed`, { videoUrl: status.videoUrl });
        completedAvatars.set(requestId, status.videoUrl);
        pendingAvatars.delete(requestId);
      } else if (status.status === 'failed') {
        logger.error(`${adapter.modelName} avatar video ${requestId} failed`, { error: status.error });
        pendingAvatars.delete(requestId);
        throw new Error(`${adapter.modelName} avatar video generation failed: ${status.error}`);
      }
    }
    
    // Update progress only if it has changed
    let currentProgress: number;
    if (completedAvatars.size === 0) {
      // No avatar completed yet: add 1% per attempt
      currentProgress = Math.min(attempts, 99); // Cap at 99% until at least one completes
    } else {
      // At least one avatar completed: show real percentage
      currentProgress = Math.round((completedAvatars.size / totalAvatars) * 100);
    }
    
    // Only update metadata if progress has changed
    if (currentProgress !== lastProgressSent) {
      await metadata.replace({
        status: 'processing',
        step: 'avatar',
        progress: currentProgress
      });
      lastProgressSent = currentProgress;
    }
    
    // If there are still pending avatars, wait before next check
    if (pendingAvatars.size > 0) {
      await wait.for({ seconds: 6 });
    }
  }
  
  // Check if we timed out
  if (pendingAvatars.size > 0) {
    throw new Error(`Timeout: ${pendingAvatars.size} ${adapter.modelName} avatar(s) did not complete after ${maxAttempts * 6} seconds`);
  }
  
  // Upload all completed avatars to R2 in parallel
  logger.log(`Uploading completed ${adapter.modelName} avatars to R2...`);
  const uploadPromises = Array.from(completedAvatars.entries()).map(async ([requestId, videoUrl]) => {
    const render = avatarRendersWithRequestIds.find(r => r.requestId === requestId);
    if (!render) return null;
    
    try {
      const fileName = `${adapter.getFileNamePrefix()}-${video.id}-${render.audioIndex}-${render.startInFrames}-${Date.now()}`;
      const r2VideoUrl = await uploadVideoFromUrlToS3(videoUrl, "medias-users", fileName);
      logger.log(`${adapter.modelName} avatar ${render.audioIndex} uploaded to R2`, { r2VideoUrl });
      
      return {
        audioIndex: render.audioIndex,
        startInFrames: render.startInFrames,
        durationInSeconds: render.durationInSeconds,
        url: r2VideoUrl
      };
    } catch (error) {
      logger.error(`Error uploading ${adapter.modelName} avatar ${render.audioIndex} to R2`, { error });
      throw error;
    }
  });
  
  const uploadResults = await Promise.all(uploadPromises);
  const finalAvatarRenders = uploadResults.filter(r => r !== null) as { audioIndex: number; startInFrames: number; durationInSeconds: number; url: string }[];
  
  // Sort renders by startInFrames to ensure correct z-index order
  finalAvatarRenders.sort((a, b) => a.startInFrames - b.startInFrames);
  
  logger.log(`All ${adapter.modelName} avatar videos completed and uploaded`, { finalAvatarRenders });
  
  // Calculate total avatar cost
  const totalAvatarDuration = trimmedAvatarRenders.reduce((sum, render) => sum + render.durationInSeconds, 0);
  const cost = adapter.calculateCost(totalAvatarDuration);
  logger.log(`${adapter.modelName} cost calculated`, { totalAvatarDuration, cost });
  
  return { renders: finalAvatarRenders, cost };
}

// Generate Veo3 avatar videos and return results array
async function generateVeo3Results(
  veo3Renders: any[],
  veo3Mode: Veo3GenerationMode,
  aspectRatio: "9:16" | "16:9"
): Promise<{ resultsArray: Veo3Result[], transcriptionCost: number, voiceChangerCost: number }> {
  logger.log('Starting all Veo3 video generations...');
  
  // Start all video generations in parallel
  const veo3RequestIds = await Promise.all(
    veo3Renders.map(async (render) => {
      try {
        const { request_id } = await startVeo3VideoGeneration({
          prompt: `A person talk to the camera, and say "${render.text}". No background music.`,
          image_url: render.avatarUrl,
          generate_audio: true,
          aspect_ratio: aspectRatio
        }, veo3Mode, true);
        logger.log(`Veo3 generation started for audioIndex ${render.audioIndex}`, { request_id });
        return { ...render, requestId: request_id };
      } catch (error) {
        logger.error(`Error starting Veo3 generation for audioIndex ${render.audioIndex}`, { error });
        throw error;
      }
    })
  );

  console.log("veo3RequestIds", veo3RequestIds);
  
  // Object to store results as they complete
  const veo3Results = new Map<number, { videoUrl: string; audioUrl: string; transcription: any }>();
  let transcriptionCost = 0;
  let voiceChangerCost = 0;
  
  // Polling with processing as soon as a video is ready
  const pendingRequests = new Set(veo3RequestIds.map(r => r.requestId));
  const processingPromises = new Map<string, Promise<void>>();
  let attempts = 0;
  const maxAttempts = 200;
  let lastProgressSent = -1;
  
  while (pendingRequests.size > 0 && attempts < maxAttempts) {
    attempts++;
    
    // Check all statuses in parallel
    const statusChecks = await Promise.all(
      Array.from(pendingRequests).map(async (requestId) => {
        try {
          const status = await checkVeo3RequestStatus(requestId, veo3Mode);
          return { requestId, status };
        } catch (error) {
          logger.error(`Error checking Veo3 status for ${requestId}`, { error });
          return { requestId, status: { status: 'FAILED' as const, error } };
        }
      })
    );
    
    // Process completed videos - launch processing in parallel (non-blocking)
    for (const { requestId, status } of statusChecks) {
      if (status.status === 'COMPLETED') {
        const render = veo3RequestIds.find(r => r.requestId === requestId);
        if (!render) continue;
        
        // Remove from pending immediately
        pendingRequests.delete(requestId);
        
        // Launch processing asynchronously (don't wait)
        const processingPromise = (async () => {
          try {
            // Get the result
            const result = await getVeo3RequestResult(requestId, veo3Mode);
            const videoUrl = result.data?.video?.url;
            
            if (!videoUrl) {
              throw new Error(`No video URL for audioIndex ${render.audioIndex}`);
            }
            
            logger.log(`Veo3 video completed for audioIndex ${render.audioIndex}`, { videoUrl });
            
            // Convert video audio with voice-changer
            logger.log(`Converting video audio to voice for audioIndex ${render.audioIndex}...`);
            const convertedAudio = await voiceChangerFromVideo(videoUrl, render.voiceId);
            
            // Calculate voice changer cost (ElevenLabs without turbo)
            voiceChangerCost += calculateElevenLabsCost(render.text, false);
            
            // Upload audio to R2
            const audioUrl = await uploadToS3Audio(convertedAudio, 'medias-users');
            logger.log(`Converted audio uploaded for audioIndex ${render.audioIndex}`, { audioUrl });
            
            // Transcribe the audio
            logger.log(`Transcribing audio for audioIndex ${render.audioIndex}...`);
            const transcriptionResult = await getTranscription(audioUrl, render.text);
            
            if (!transcriptionResult) {
              throw new Error(`Transcription failed for audioIndex ${render.audioIndex}`);
            }
            
            logger.log(`Transcription completed for audioIndex ${render.audioIndex}`, {
              text: transcriptionResult.text,
              wordCount: transcriptionResult.raw?.words?.length
            });

            transcriptionCost += transcriptionResult.cost;
            
            const words = transcriptionResult.raw.words;
            veo3Results.set(render.audioIndex, {
              videoUrl,
              audioUrl,
              transcription: {
                text: transcriptionResult.text,
                language: transcriptionResult.raw.language,
                start: words.length > 0 ? words[0].start : 0,
                end: words.length > 0 ? words[words.length - 1].end : 0,
                words: words
              }
            });
            
            logger.log(`Veo3 render ${render.audioIndex} fully processed`);
          } catch (error) {
            logger.error(`Error processing completed Veo3 video for audioIndex ${render.audioIndex}`, { error });
            throw error;
          } finally {
            // Remove from processing map when done
            processingPromises.delete(requestId);
          }
        })();
        
        processingPromises.set(requestId, processingPromise);
        
      } else if ((status as any).status === 'FAILED') {
        logger.error(`Veo3 generation failed for ${requestId}`, { error: (status as any).error });
        pendingRequests.delete(requestId);
        throw new Error(`Veo3 video generation failed: ${(status as any).error}`);
      }
    }
    
    // Update progress metadata
    const completedCount = veo3Results.size;
    const totalCount = veo3RequestIds.length;
    
    let currentProgress: number;
    if (completedCount === 0) {
      currentProgress = Math.min(attempts, 99);
    } else {
      const realProgress = Math.round((completedCount / totalCount) * 100);
      const waitProgress = attempts;
      currentProgress = Math.max(realProgress, waitProgress);
    }
    
    if (currentProgress !== lastProgressSent) {
      await metadata.replace({
        status: 'processing',
        step: 'avatar',
        progress: currentProgress
      });
      lastProgressSent = currentProgress;
    }
    
    if (pendingRequests.size > 0) {
      await wait.for({ seconds: 6 });
    }
  }
  
  // Wait for all processing to complete
  if (processingPromises.size > 0) {
    logger.log(`Waiting for ${processingPromises.size} video processing tasks to complete...`);
    await Promise.all(Array.from(processingPromises.values()));
    logger.log('All processing tasks completed');
  }
  
  // Check that everything completed
  if (pendingRequests.size > 0) {
    throw new Error(`Timeout: ${pendingRequests.size} Veo3 video(s) did not complete after ${maxAttempts * 6} seconds`);
  }
  
  logger.log('All Veo3 videos completed and processed', {
    resultCount: veo3Results.size,
    audioIndexes: Array.from(veo3Results.keys())
  });
  
  // Convert results Map to array
  const resultsArray = Array.from(veo3Results.entries()).map(([audioIndex, data]) => ({
    audioIndex,
    audioUrl: data.audioUrl,
    videoUrl: data.videoUrl,
    transcription: data.transcription
  }));
  
  return { resultsArray, transcriptionCost, voiceChangerCost };
}

export const exportVideoTask = task({
  id: "export-video",
  maxDuration: 600,
  retry: {
    maxAttempts: 1,
  },
  run: async (payload: ExportVideoPayload, { ctx }) => {
    try {
      const videoId = payload.videoId;
      const exportId = payload.exportId;
      let renderAudioCost = 0;
      let avatarCost = 0;

      logger.log("Exporting video...");
      const exportData : IExport = await updateExport(exportId, { runId: ctx.run.id, status: 'processing' });
      
      const model = exportData.avatarModel || 'heygen'; // Get model from exportData

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
      if (video.video?.avatar && (video.video?.avatar?.id || (!video.video?.avatar?.previewUrl && video.video?.avatar?.thumbnail)) && video.video?.audio?.voices && ctx.attempt.number === 1) {
        
        if (model === 'heygen-iv' || model === 'omnihuman') {
          // Use adapter pattern for multi-segment avatar models
          const adapter = model === 'heygen-iv' ? heygenIVAdapter : omnihumanAdapter;
          logger.log(`Using ${adapter.modelName} model - generating avatar render list...`);
          
          const avatarRenderList = generateAvatarRenderList(video);
          logger.log(`Generated ${avatarRenderList.length} avatar renders`, { avatarRenderList });
          
          if (avatarRenderList.length > 0) {
            // Trim audios in parallel
            const trimmedAvatarRenders = await trimAvatarAudios(avatarRenderList);
            logger.log("Avatar audios trimmed", { trimmedAvatarRenders });
            
            // Generate avatar videos using the common function
            const { renders, cost } = await generateAvatarVideosWithModel(adapter, video, trimmedAvatarRenders);
            avatarCost = cost;
            
            // Store the final renders in the video avatar object
            if (video.video.avatar) {
              video.video.avatar.renders = renders;
              await updateVideo(video);
              logger.log("Avatar renders saved to video", { renders: video.video.avatar.renders });
            }
          }
        } else if (model === 'veo-3' || model === 'veo-3-fast') {
          logger.log(`Using ${model} model - generating Veo3 avatar videos with integrated audio...`);
          
          // 1. Generate Veo3 render list
          const veo3Mode = model === 'veo-3-fast' ? Veo3GenerationMode.FAST : Veo3GenerationMode.STANDARD;
          const veo3Renders = generateVeo3RenderList(video);
          logger.log(`Generated ${veo3Renders.length} Veo3 renders`, { veo3Renders });

          const format = video.video?.avatar?.format ? video.video?.avatar?.format : video.video?.format || 'vertical';

          const aspectRatio = getVeo3AspectRatio(format, video.video?.width, video.video?.height);
          logger.log(`Determined aspect ratio for Veo3: ${aspectRatio}`);

          let resultsArray: Veo3Result[];
          let veo3VoiceChangerCost = 0;
          let veo3TranscriptionCost = 0;
          
          if (ctx.environment.type === "PRODUCTION") {
            resultsArray = veo3ResultArrayMock;
          } else if (veo3Renders.length > 0) {
            const { resultsArray: generatedResults, transcriptionCost, voiceChangerCost } = await generateVeo3Results(
              veo3Renders,
              veo3Mode,
              aspectRatio
            );
            resultsArray = generatedResults;
            veo3TranscriptionCost = transcriptionCost;
            veo3VoiceChangerCost = voiceChangerCost;
            
            logger.log('[VEO3_UPDATE] Starting video update with Veo3 results...');
          } else {
            resultsArray = [];
          }
            
          logger.log('[VEO3_UPDATE] Results array', { resultsArray });
          
          // Get original sequences grouped by audioIndex
          const originalSequencesByAudioIndex = new Map<number, ISequence[]>();
          if (video.video && video.video.sequences) {
            video.video.sequences.forEach((seq: ISequence) => {
              if (!originalSequencesByAudioIndex.has(seq.audioIndex)) {
                originalSequencesByAudioIndex.set(seq.audioIndex, []);
              }
              originalSequencesByAudioIndex.get(seq.audioIndex)!.push(seq);
            });
          }
          
          logger.log('[VEO3_UPDATE] Original sequences grouped by audioIndex', {
            groupCount: originalSequencesByAudioIndex.size,
            groups: Array.from(originalSequencesByAudioIndex.entries()).map(([audioIndex, seqs]) => ({
              audioIndex,
              sequenceCount: seqs.length
            }))
          });
          
          // Recreate sequences from Veo3 results
          const newSequences = recreateSequencesFromVeo3Results(
            resultsArray,
            originalSequencesByAudioIndex,
            logger
          );
          
          // Group sequences by audioIndex to get actual duration
          const sequencesByAudioIndex = new Map<number, ISequence[]>();
          newSequences.forEach(seq => {
            if (!sequencesByAudioIndex.has(seq.audioIndex)) {
              sequencesByAudioIndex.set(seq.audioIndex, []);
            }
            sequencesByAudioIndex.get(seq.audioIndex)!.push(seq);
          });
          
          // Create voiceId map for voices creation
          const voiceIdByAudioIndex = new Map<number, string>();
          veo3Renders.forEach(render => {
            if (render.voiceId) {
              voiceIdByAudioIndex.set(render.audioIndex, render.voiceId);
            }
          });
          
          // Create avatar renders with actual durations
          const avatarRenders = createAvatarRendersFromSequences(
            resultsArray,
            sequencesByAudioIndex,
            logger
          );
          
          // Create voices with actual durations
          const voices = createVoicesFromResults(
            resultsArray,
            sequencesByAudioIndex,
            voiceIdByAudioIndex,
            logger
          );
          
          // Update video metadata with actual duration
          const totalDuration = voices.length > 0 ? voices[voices.length - 1].end : 0;
          
          logger.log('[VEO3_UPDATE] Updating video with new data', {
            sequenceCount: newSequences.length,
            avatarRenderCount: avatarRenders.length,
            voiceCount: voices.length,
            totalDuration
          });
          
          // Update video object
          if (video.video) {
            video.video.sequences = newSequences;
            
            if (video.video.avatar) {
              video.video.avatar.renders = avatarRenders;
            }
            
            if (video.video.audio) {
              video.video.audio.voices = voices;
            }
            
            if (video.video.metadata) {
              video.video.metadata.audio_duration = totalDuration;
            }
          }
          
          logger.log('[VEO3_UPDATE] Video updated successfully', {
            sequences: video.video?.sequences?.length,
            avatarRenders: video.video?.avatar?.renders?.length,
            voices: video.video?.audio?.voices?.length,
            duration: video.video?.metadata?.audio_duration
          });
          
          // Calculate costs
          // Avatar cost = number of videos * cost per video
          avatarCost = calculateVeo3Cost(resultsArray.length, model as 'veo-3' | 'veo-3-fast');
          
          video.costToGenerate = (video.costToGenerate || 0) + veo3VoiceChangerCost + veo3TranscriptionCost;
          
          logger.log('[VEO3_UPDATE] Costs calculated', {
            avatarCost,
            voiceChangerCost: veo3VoiceChangerCost,
            transcriptionCost: veo3TranscriptionCost,
            totalCostToGenerate: video.costToGenerate
          });
          
          // Log final result before saving
          logger.log('[VEO3_UPDATE] Final video structure ready for save', {
            sequences: video.video?.sequences?.length,
            avatarRenders: video.video?.avatar?.renders?.length,
            voices: video.video?.audio?.voices?.length,
            duration: video.video?.metadata?.audio_duration
          });
          
          // Save the video to database
          logger.log('[VEO3_UPDATE] Saving video to database...');
          await updateVideo(video);
          logger.log('[VEO3_UPDATE] ✅ Video saved successfully to database', { videoId: video.id });
          
          // Continue with the export process
          logger.log('[VEO3_UPDATE] ✅ Veo3 processing complete - continuing with render...');
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
          const avatarResponse = await generateAvatarVideo(video.video.avatar!, audioRenderStatus.url || '', video.video.format);

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
  const outputPath = path.join(tempDirectory, `trimmed_audio_${randomUUID()}_${retryCount}.wav`);

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


// Trim avatars audios in parallel
const trimAvatarAudios = async (avatarRenders: AvatarRenderData[]): Promise<AvatarRenderData[]> => {
  logger.log(`Trimming ${avatarRenders.length} avatar audios in parallel...`);
  
  const totalAudios = avatarRenders.length;
  let completedAudios = 0;
  let lastProgressSent = -1;
  
  const trimPromises = avatarRenders.map(async (render) => {
    // Only trim if we have start or end defined
    if (render.start !== undefined || render.end !== undefined) {
      try {
        const trimResult = await trimAudioLocal(render.audioUrl, render.start, render.end);
        
        // Update progress
        completedAudios++;
        const currentProgress = Math.round((completedAudios / totalAudios) * 100);
        
        if (currentProgress !== lastProgressSent) {
          await metadata.replace({
            status: 'processing',
            step: 'render-audio',
            progress: currentProgress
          });
          lastProgressSent = currentProgress;
        }
        
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
    completedAudios++;
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