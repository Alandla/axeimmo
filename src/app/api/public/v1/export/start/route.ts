import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, ApiError, API_ERROR_CODES } from '@/src/lib/api-auth'
import { applyRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limiting'
import { getVideoById } from '@/src/dao/videoDao'
import { createExport } from '@/src/dao/exportDao'
import { tasks } from '@trigger.dev/sdk/v3'
import { calculateGenerationCredits } from '@/src/lib/video-estimation'
import { objectIdToString } from '@/src/lib/utils'
import { calculateAvatarCreditsForUser, calculateTotalAvatarDuration, calculateHighResolutionCostCredits, calculateVeo3Duration } from '@/src/lib/cost'

interface ExportVideoRequest {
  video_id: string;
  format?: 'vertical' | 'square' | 'ads' | 'custom';
  width?: number;
  height?: number;
  webhook_url?: string;
  avatar_model?: 'standard' | 'premium' | 'ultra' | 'veo-3' | 'veo-3-fast';
}

function convertAvatarModel(publicModel?: string): 'heygen' | 'heygen-iv' | 'omnihuman' | 'veo-3' | 'veo-3-fast' {
  switch (publicModel) {
    case 'premium': return 'heygen-iv';
    case 'ultra': return 'omnihuman';
    case 'veo-3': return 'veo-3';
    case 'veo-3-fast': return 'veo-3-fast';
    case 'standard':
    default: return 'heygen';
  }
}

export async function POST(req: NextRequest) {
  try {
    const { space, apiKey } = await authenticateApiKey(req);
    
    // Rate limiting
    const { remaining, resetTime } = await applyRateLimit(space.id, apiKey.rateLimitPerMinute);
    
    const params: ExportVideoRequest = await req.json();
    
    console.info(`POST /api/public/v1/export/start by space: ${space.id}`);
    console.info('params', params);

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

    if (params.format && !['vertical', 'square', 'ads', 'custom'].includes(params.format)) {
      return NextResponse.json({
        error: "Invalid format",
        details: [{ code: API_ERROR_CODES.INVALID_FORMAT, message: "Format must be one of: 'vertical', 'square', 'ads', 'custom'", field: "format" }]
      }, { 
        status: 400,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    // Validation des dimensions custom
    if (params.width !== undefined) {
      if (typeof params.width !== 'number' || params.width < 1 || params.width > 5000) {
        return NextResponse.json({
          error: "Invalid width",
          details: [{ code: API_ERROR_CODES.INVALID_VALUE, message: "Width must be a number between 1 and 5000", field: "width" }]
        }, { 
          status: 400,
          headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
        });
      }
    }

    if (params.height !== undefined) {
      if (typeof params.height !== 'number' || params.height < 1 || params.height > 5000) {
        return NextResponse.json({
          error: "Invalid height",
          details: [{ code: API_ERROR_CODES.INVALID_VALUE, message: "Height must be a number between 1 and 5000", field: "height" }]
        }, { 
          status: 400,
          headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
        });
      }
    }

    if (params.avatar_model && !['standard', 'premium', 'ultra', 'veo-3', 'veo-3-fast'].includes(params.avatar_model)) {
      return NextResponse.json({
        error: "Invalid avatar model",
        details: [{ code: "INVALID_AVATAR_MODEL", message: "avatar_model must be one of: 'standard', 'premium', 'ultra', 'veo-3', 'veo-3-fast'", field: "avatar_model" }]
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
    
    // Determine avatar model based on video avatar and user input
    let internalModel: 'heygen' | 'heygen-iv' | 'omnihuman' | 'veo-3' | 'veo-3-fast' | undefined = undefined;
    
    if (video.video?.avatar) {
      const hasPreviewUrl = !!video.video.avatar.previewUrl;
      const isVeoVideo = video.useVeo3 === true;
      
      if (params.avatar_model) {
        // User specified a model - validate compatibility
        const requestedModel = convertAvatarModel(params.avatar_model);
        const isVeoModel = requestedModel === 'veo-3' || requestedModel === 'veo-3-fast';
        
        // If video is created with useVeo3, only accept Veo models
        if (isVeoVideo && !isVeoModel) {
          return NextResponse.json({
            error: "Incompatible avatar model",
            details: [{ 
              code: "INCOMPATIBLE_AVATAR_MODEL", 
              message: "This video was created for Veo models. Only 'veo-3' and 'veo-3-fast' are available."
            }]
          }, { 
            status: 400,
            headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
          });
        }
        
        // If video is not for Veo, check standard compatibility rules
        if (!isVeoVideo) {
          // Check compatibility: standard only if previewUrl exists, others only if no previewUrl
          if (hasPreviewUrl && requestedModel !== 'heygen') {
            return NextResponse.json({
              error: "Incompatible avatar model",
              details: [{ 
                code: "INCOMPATIBLE_AVATAR_MODEL", 
                message: "This avatar only supports 'standard' model. Premium, ultra, and Veo models are not available for this avatar."
              }]
            }, { 
              status: 400,
              headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
            });
          }
          
          if (!hasPreviewUrl && requestedModel === 'heygen') {
            return NextResponse.json({
              error: "Incompatible avatar model",
              details: [{ 
                code: "INCOMPATIBLE_AVATAR_MODEL", 
                message: "Standard model is not available for this avatar. Use 'premium', 'ultra', 'veo-3', or 'veo-3-fast' instead."
              }]
            }, { 
              status: 400,
              headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
            });
          }
        }
        
        internalModel = requestedModel;
      } else {
        // No model specified - auto-select based on video type and avatar type
        if (isVeoVideo) {
          internalModel = 'veo-3-fast'; // Default to fast for Veo videos
        } else {
          internalModel = hasPreviewUrl ? 'heygen' : 'heygen-iv';
        }
      }
    } else if (params.avatar_model) {
      // No avatar but model specified - return error
      return NextResponse.json({
        error: "Invalid parameter",
        details: [{ 
          code: "INVALID_PARAMETER", 
          message: "avatar_model parameter cannot be used when the video does not contain an avatar"
        }]
      }, { 
        status: 400,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }
    
    // Calculate base export cost
    const duration = video.video?.metadata?.audio_duration || 30;
    const baseCost = wasCreatedViaAPI ? 0 : calculateGenerationCredits(duration);

    // Calculate avatar cost if applicable
    let avatarCost = 0;
    if (video.video?.avatar && internalModel && internalModel !== 'heygen') {
      // For veo models, calculate based on veo3 render segments (each billed at 8 seconds)
      // For heygen-iv and omnihuman, use avatar visibility duration
      const isVeo3Model = internalModel === 'veo-3' || internalModel === 'veo-3-fast';
      const costDuration = isVeo3Model
        ? calculateVeo3Duration(video)
        : calculateTotalAvatarDuration(video);
      
      avatarCost = calculateAvatarCreditsForUser(costDuration, internalModel);
    }

    // Calculate high resolution cost (only for custom format)
    const finalFormat = params.format || video.video?.format;
    let highResCost = 0;
    
    if (finalFormat === 'custom') {
      const finalWidth = params.width || video.video?.width || 1080;
      const finalHeight = params.height || video.video?.height || 1920;
      
      highResCost = calculateHighResolutionCostCredits(
        duration,
        finalWidth,
        finalHeight
      );
    }

    const totalCost = baseCost + avatarCost + highResCost;

    // Check credits if cost > 0
    if (totalCost > 0 && space.credits < totalCost) {
      return NextResponse.json({
        error: "Insufficient credits",
        details: [{ 
          code: API_ERROR_CODES.INSUFFICIENT_CREDITS, 
          message: `Required ${totalCost} credits, but only ${space.credits} available` 
        }]
      }, { 
        status: 402,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    // Mettre à jour le format si spécifié
    if (params.format && video.video) {
      video.video.format = params.format;
      
      // Mettre à jour width/height si format custom
      if (params.format === 'custom') {
        video.video.width = params.width || 1080;
        video.video.height = params.height || 1920;
      }
    }

    // Créer l'export
    const exportData = await createExport({
      videoId: params.video_id,
      spaceId: space.id,
      creditCost: totalCost,
      ...(internalModel && { avatarModel: internalModel }),
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
      estimated_credits: totalCost
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