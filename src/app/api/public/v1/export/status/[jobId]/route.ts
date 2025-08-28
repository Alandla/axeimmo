import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, ApiError, API_ERROR_CODES } from '@/src/lib/api-auth'
import { applyRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limiting'
import { runs } from '@trigger.dev/sdk/v3'

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  try {
    const { space, apiKey } = await authenticateApiKey(req);
    
    // Rate limiting
    const { remaining, resetTime } = await applyRateLimit(space.id, apiKey.rateLimitPerMinute);
    
    console.info(`GET /api/public/v1/export/status/${params.jobId} by space: ${space.id}`);

    // Récupération du run
    const run = await runs.retrieve(params.jobId);
    
    if (!run) {
      return NextResponse.json({
        error: "Job not found",
        details: [{ code: API_ERROR_CODES.JOB_NOT_FOUND, message: `Job with ID "${params.jobId}" not found` }]
      }, { 
        status: 404,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    // Vérification que le job appartient bien au space (via les tags)
    const spaceTags = run.tags?.filter(tag => tag.startsWith('space:')) || [];
    const jobSpaceId = spaceTags[0]?.replace('space:', '');
    
    if (jobSpaceId !== space.id) {
      return NextResponse.json({
        error: "Unauthorized",
        details: [{ code: API_ERROR_CODES.UNAUTHORIZED_JOB, message: "This job does not belong to your space" }]
      }, { 
        status: 403,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    // Mapping du statut Trigger vers le statut API
    let status: 'pending' | 'processing' | 'completed' | 'failed';
    switch (run.status) {
      case 'QUEUED':
      case 'PENDING_VERSION':
      case 'DEQUEUED':
      case 'WAITING':
      case 'DELAYED':
        status = 'pending';
        break;
      case 'EXECUTING':
        status = 'processing';
        break;
      case 'COMPLETED':
        status = 'completed';
        break;
      case 'FAILED':
      case 'CANCELED':
      case 'CRASHED':
      case 'SYSTEM_FAILURE':
      case 'EXPIRED':
      case 'TIMED_OUT':
        status = 'failed';
        break;
      default:
        status = 'pending';
    }

    const response: any = {
      job_id: params.jobId,
      status,
      progress: run.metadata?.progress || 0,
      current_step: run.metadata?.step || null
    };

    // Si complété, ajouter les résultats
    if (status === 'completed' && run.metadata?.downloadUrl) {
      response.result = {
        video_url: run.metadata.downloadUrl,
        thumbnail_url: run.output?.thumbnailUrl,
        cost: run.metadata.creditCost || 0,
        created_at: new Date(run.updatedAt).toISOString()
      };
    }

    // Si échec, ajouter l'erreur
    if (status === 'failed') {
      response.error = {
        code: run.metadata?.errorCode || 'EXPORT_FAILED',
        message: run.metadata?.errorMessage || 'Video export failed'
      };
    }

    return NextResponse.json(response, {
      headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
    });

  } catch (error: any) {
    console.error('Error in export status:', error);
    
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