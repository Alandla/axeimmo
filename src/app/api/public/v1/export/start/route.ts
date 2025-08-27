import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, ApiError, API_ERROR_CODES } from '@/src/lib/api-auth'
import { applyRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limiting'
import { getVideoById } from '@/src/dao/videoDao'
import { createExport } from '@/src/dao/exportDao'
import { tasks } from '@trigger.dev/sdk/v3'
import { calculateGenerationCredits } from '@/src/lib/video-estimation'
import { objectIdToString } from '@/src/lib/utils'

interface ExportVideoRequest {
  video_id: string;
  format?: 'vertical' | 'square' | 'ads';
  webhook_url?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { space, apiKey } = await authenticateApiKey(req);
    
    // Rate limiting
    const { remaining, resetTime } = await applyRateLimit(space.id, apiKey.rateLimitPerMinute);
    
    const params: ExportVideoRequest = await req.json();
    
    console.trace(`POST /api/public/v1/export/start by space: ${space.id}`);

    // Validation des paramètres
    if (!params.video_id) {
      return NextResponse.json({
        error: "Missing required parameter",
        details: [{ code: "MISSING_VIDEO_ID", message: "video_id is required", field: "video_id" }]
      }, { 
        status: 400,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    if (params.format && !['vertical', 'square', 'ads'].includes(params.format)) {
      return NextResponse.json({
        error: "Invalid format",
        details: [{ code: API_ERROR_CODES.INVALID_FORMAT, message: "Format must be one of: 'vertical', 'square', 'ads'", field: "format" }]
      }, { 
        status: 400,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    // Récupérer la vidéo
    const video = await getVideoById(params.video_id);
    
    if (!video) {
      return NextResponse.json({
        error: "Video not found",
        details: [{ code: "VIDEO_NOT_FOUND", message: `Video with ID "${params.video_id}" not found` }]
      }, { 
        status: 404,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    // Vérifier que la vidéo appartient au space
    if (objectIdToString(video.spaceId) !== space.id) {
      return NextResponse.json({
        error: "Unauthorized",
        details: [{ code: "UNAUTHORIZED_VIDEO", message: "This video does not belong to your space" }]
      }, { 
        status: 403,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    // Vérifier que la vidéo est terminée
    if (video.state.type !== 'done') {
      return NextResponse.json({
        error: "Video not ready",
        details: [{ code: "VIDEO_NOT_READY", message: "Video generation must be completed before export" }]
      }, { 
        status: 400,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    // Check if video was created via API (no userId in CREATE step)
    const createEvent = video.history?.find((h: { step: string }) => h.step === 'CREATE');
    const wasCreatedViaAPI = !createEvent?.user;
    
    // Calculer le coût de l'export
    const duration = video.video?.metadata?.audio_duration || 30;
    const exportCost = wasCreatedViaAPI ? 0 : calculateGenerationCredits(duration);

    // Vérifier les crédits seulement si ce n'est pas une vidéo créée via API
    if (!wasCreatedViaAPI && space.credits < exportCost) {
      return NextResponse.json({
        error: "Insufficient credits",
        details: [{ 
          code: API_ERROR_CODES.INSUFFICIENT_CREDITS, 
          message: `Required ${exportCost} credits, but only ${space.credits} available` 
        }]
      }, { 
        status: 402,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    // Mettre à jour le format si spécifié
    if (params.format && video.video) {
      video.video.format = params.format;
    }

    // Créer l'export
    const exportData = await createExport({
      videoId: params.video_id,
      spaceId: space.id,
      creditCost: exportCost,
      status: 'pending',
      webhookUrl: params.webhook_url
    });

    // Démarrer la tâche d'export
    const handle = await tasks.trigger("export-video", {
      videoId: params.video_id,
      exportId: exportData.id
    }, {
      tags: [`space:${space.id}`, `api-request`, `export:${exportData.id}`]
    });

    return NextResponse.json({
      job_id: handle.id,
      status: 'pending',
      estimated_credits: exportCost
    }, { 
      status: 201,
      headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
    });

  } catch (error: any) {
    console.error('Error in export start:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json({ 
        error: error.message,
        details: [{ code: error.code || 'API_ERROR', message: error.message }]
      }, { status: error.statusCode });
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: [{ code: API_ERROR_CODES.INTERNAL_ERROR, message: "An unexpected error occurred" }]
    }, { status: 500 });
  }
}