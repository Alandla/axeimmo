import { logger, task } from "@trigger.dev/sdk";
import { extractFramesFromVideo } from "../lib/ffmpeg";
import { analyzeVideoSequence } from "../lib/workflowai";
import { IMedia } from "../types/video";

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
      
      // Analyser les frames avec WorkflowAI
      logger.log(`[ANALYZE] Analyzing video frames with WorkflowAI`);
      const { sequences: videoSequences, cost: sequenceCost } = await analyzeVideoSequence(frames);
      
      // Convertir les séquences en descriptions
      const descriptions = videoSequences
        .filter(seq => seq.description) // On garde uniquement les séquences avec une description
        .map(seq => ({
          start: seq.start_timestamp || 0,
          duration: seq.duration,
          text: seq.description || ""
        }));
      
      logger.log(`[ANALYZE] Video analysis completed with ${descriptions.length} descriptions`, { descriptions });
      
      return {
        descriptions,
        cost: sequenceCost
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