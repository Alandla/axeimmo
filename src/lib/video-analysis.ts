import { logger } from "@trigger.dev/sdk";
import { extractFramesFromVideo } from "./ffmpeg";
import { analyzeVideoSequence } from "./workflowai";
import { uploadToS3Image } from "./r2";
import { v4 as uuidv4 } from 'uuid';
import { Input, ALL_FORMATS, UrlSource } from 'mediabunny';

/**
 * Interface pour le résultat de l'analyse vidéo
 */
export interface VideoAnalysisResult {
  descriptions: { start: number; duration?: number; text: string }[];
  frames: string[];
  durationInSeconds: number;
  cost: number;
}

/**
 * Analyse une vidéo et génère des descriptions pour ses séquences
 * Cette méthode utilise WorkflowAI pour analyser les frames extraites de la vidéo
 * 
 * @param videoUrl - URL de la vidéo à analyser
 * @param mediaId - ID optionnel du média pour nommer les frames uploadées
 * @returns Résultat de l'analyse contenant descriptions, frames, durée et coût
 */
export async function analyzeVideo(videoUrl: string, mediaId?: string): Promise<VideoAnalysisResult> {
  logger.log("[ANALYZE] Starting video analysis...", { videoUrl, mediaId });
  
  try {
    // Lancer en parallèle : extraction des frames et récupération des métadonnées
    logger.log(`[ANALYZE] Starting parallel extraction of frames and metadata for: ${videoUrl}`);
    
    const [frames, durationInSeconds] = await Promise.all([
      // Extraire les frames de la vidéo
      (async () => {
        logger.log(`[ANALYZE] Extracting frames from video: ${videoUrl}`);
        return await extractFramesFromVideo(videoUrl);
      })(),
      
      // Obtenir la durée de la vidéo avec MediaBunny
      (async () => {
        logger.log(`[ANALYZE] Getting video duration with MediaBunny: ${videoUrl}`);
        const input = new Input({
          source: new UrlSource(videoUrl),
          formats: ALL_FORMATS,
        });
        const duration = await input.computeDuration() || 10;
        logger.log(`[ANALYZE] Video duration with MediaBunny: ${duration}`);
        return duration;
      })()
    ]);
    
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
          const frameUrl = await uploadToS3Image(frameBuffer, 'medias-users', `frames_${frameId}_${mediaId || 'unknown'}`);
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
      videoUrl,
      mediaId
    });
    
    throw error;
  }
} 