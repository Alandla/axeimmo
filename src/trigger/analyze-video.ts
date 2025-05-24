import { logger, task } from "@trigger.dev/sdk";
import { extractFramesFromVideo } from "../lib/ffmpeg";
import { analyzeVideoSequence } from "../lib/workflowai";
import { IMedia } from "../types/video";
import { uploadToS3Image } from "../lib/r2";
import { v4 as uuidv4 } from 'uuid';
import { parseMedia } from '@remotion/media-parser';

/**
 * Interface pour les paramètres d'entrée de la tâche d'analyse vidéo
 */
interface AnalyzeVideoPayload {
  videoUrl: string;
  mediaId?: string;
  userId?: string;
}

/**
 * Interface pour le résultat de l'analyse vidéo
 */
interface AnalyzeVideoResult {
  descriptions: { start: number; duration?: number; text: string }[];
  frames: string[];
  durationInSeconds: number;
  cost: number;
}

/**
 * Tâche pour analyser une vidéo et générer des descriptions pour ses séquences
 * Cette tâche utilise WorkflowAI pour analyser les frames extraites de la vidéo
 */
export const analyzeVideoTask = task({
  id: "analyze-video",
  machine: {
    preset: "medium-1x"
  },
  maxDuration: 120, // 2 minutes maximum
  run: async (payload: AnalyzeVideoPayload, { ctx }): Promise<AnalyzeVideoResult> => {
    logger.log("[ANALYZE] Starting video analysis...", { payload });
    
    try {
      // Extraire les frames de la vidéo
      logger.log(`[ANALYZE] Extracting frames from video: ${payload.videoUrl}`);
      const frames = await extractFramesFromVideo(payload.videoUrl);
      
      // Obtenir la durée de la vidéo en parallèle
      const metadata = await parseMedia({
        acknowledgeRemotionLicense: true,
        src: payload.videoUrl,
        fields: {
          durationInSeconds: true,
        },
      });
      
      const durationInSeconds = (metadata.durationInSeconds as number) || 10;
      
      // Lancer en parallèle : l'analyse IA et l'upload des frames pour le trim
      const [analysisResult, trimFrameUrls] = await Promise.all([
        // Analyser les frames avec WorkflowAI
        (async () => {
          logger.log(`[ANALYZE] Analyzing video frames with WorkflowAI`);
          const { sequences: videoSequences, cost: sequenceCost } = await analyzeVideoSequence(frames);
          logger.log(`[ANALYZE] WorkflowAI analysis completed with ${videoSequences.length} sequences and cost ${sequenceCost}`);
          return { videoSequences, sequenceCost };
        })(),
        
        // Uploader les frames pour le trim
        (async () => {
          logger.log(`[ANALYZE] Uploading trim frames...`);
          
          // Calculer le nombre de frames pour le trim (même logique que video-trim.tsx)
          const numThumbnails = Math.min(Math.max(5, Math.floor(durationInSeconds / 2)), 10);
          const interval = durationInSeconds / numThumbnails;
          
          // Sélectionner les frames correspondantes parmi celles extraites
          const selectedFrames = [];
          for (let i = 0; i < numThumbnails; i++) {
            const targetTime = i * interval;
            // Trouver la frame la plus proche de ce timestamp
            const closestFrame = frames.reduce((closest, frame) => {
              return Math.abs(frame.timestamp - targetTime) < Math.abs(closest.timestamp - targetTime) 
                ? frame 
                : closest;
            });
            selectedFrames.push(closestFrame);
          }
          
          // Upload chaque frame sélectionnée
          const uploadPromises = selectedFrames.map(async (frame) => {
            const frameBuffer = Buffer.from(frame.base64, 'base64');
            const frameId = uuidv4();
            const frameUrl = await uploadToS3Image(frameBuffer, 'medias-users', `frames_${frameId}_${payload.mediaId}`);
            logger.log(`[ANALYZE] Uploaded trim frame ${frameId} to ${frameUrl.url}`);
            return frameUrl.url;
          });
          
          return await Promise.all(uploadPromises);
        })()
      ]);
      
      // Convertir les séquences en descriptions
      const descriptions = analysisResult.videoSequences
        .filter(seq => seq.description) // On garde uniquement les séquences avec une description
        .map(seq => ({
          start: seq.start_timestamp || 0,
          duration: seq.duration,
          text: seq.description || ""
        }));
      
      logger.log(`[ANALYZE] Video analysis completed with ${descriptions.length} descriptions and ${trimFrameUrls.length} trim frames`, { descriptions });
      
      return {
        descriptions,
        frames: trimFrameUrls,
        durationInSeconds,
        cost: analysisResult.sequenceCost
      };
    } catch (error) {
      logger.error("[ANALYZE] Error analyzing video:", {
        error: error instanceof Error ? error.message : String(error),
        videoUrl: payload.videoUrl,
        mediaId: payload.mediaId
      });
      
      throw error;
    }
  }
}); 