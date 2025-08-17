import { logger, task } from "@trigger.dev/sdk";
import { analyzeVideo, VideoAnalysisResult } from "../lib/video-analysis";

/**
 * Interface pour les paramètres d'entrée de la tâche d'analyse vidéo
 */
interface AnalyzeVideoPayload {
  videoUrl: string;
  mediaId?: string;
  userId?: string;
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
  maxDuration: 600, // 10 minutes maximum
  run: async (payload: AnalyzeVideoPayload, { ctx }): Promise<VideoAnalysisResult> => {
    logger.log("[ANALYZE_TASK] Starting video analysis task...", { payload });
    
    try {
      return await analyzeVideo(payload.videoUrl, payload.mediaId);
    } catch (error) {
      logger.error("[ANALYZE_TASK] Error in video analysis task:", {
        error: error instanceof Error ? error.message : String(error),
        payload
      });
      
      throw error;
    }
  }
}); 