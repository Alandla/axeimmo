import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, ApiError, API_ERROR_CODES, isValidUrl } from '@/src/lib/api-auth'
import { applyRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limiting'
import { generateVideoScript } from '@/src/lib/script-generation'
import { transformUrlsToMedia } from '@/src/lib/media-transformer'
import { voicesConfig } from '@/src/config/voices.config'
import { avatarsConfig } from '@/src/config/avatars.config'
import { tasks } from '@trigger.dev/sdk/v3'
import { KlingGenerationMode } from '@/src/lib/fal'
import { calculateEstimatedCredits } from '@/src/lib/video-estimation'

interface GenerateVideoRequest {
  prompt?: string;
  script?: string;
  voice_id?: string;
  voice_url?: string;
  avatar_id?: string;
  avatar_url?: string;
  format?: 'vertical' | 'square' | 'ads';
  media_urls?: string[];
  webSearch?: {
    script?: boolean;
    images?: boolean;
  };
  animate_image?: boolean;
  animate_mode?: 'standard' | 'pro';
  animate_image_max?: number;
  webhook_url?: string;
  use_space_media?: boolean;
  save_media_to_space?: boolean;
}

interface ApiErrorDetail {
  code: string;
  message: string;
  field?: string;
}

export async function POST(req: NextRequest) {
  try {
    // Authentification API
    const { space, apiKey } = await authenticateApiKey(req);
    
    // Rate limiting
    const { remaining, resetTime } = await applyRateLimit(space.id, apiKey.rateLimitPerMinute);
    
    const params: GenerateVideoRequest = await req.json();
    
    // Validation des paramètres avec messages d'erreur précis
    const errors = validateGenerationRequest(params);
    if (errors.length > 0) {
      return NextResponse.json({ 
        error: "Validation failed", 
        details: errors 
      }, { 
        status: 400,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    console.log(`POST /api/public/v1/generation/start by space: ${space.id}`);

    // 1. Gestion du script
    let finalScript = params.script || '';
    let scriptCost = 0;

    if (!finalScript && params.prompt && !params.voice_url && !params.avatar_url) {
      console.log("Generating script from prompt...");
      try {
        const scriptResult = await generateVideoScript({
          prompt: params.prompt,
          webSearch: params.webSearch?.script || false
        });
        finalScript = scriptResult.script;
        scriptCost = scriptResult.cost || 0;
      } catch (error) {
        console.error('Script generation error:', error);
        return NextResponse.json({
          error: "Failed to generate script",
          details: [{ code: "SCRIPT_GENERATION_FAILED", message: "Unable to generate script from prompt" }]
        }, { 
          status: 500,
          headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
        });
      }
    }

    // 2. Transformation des médias
    let files: any[] = [];
    
    if (params.media_urls?.length) {
      try {
        const mediaFiles = await transformUrlsToMedia(params.media_urls, 'media');
        files.push(...mediaFiles);
      } catch (error) {
        console.error('Media transformation error:', error);
        return NextResponse.json({
          error: "Failed to process media URLs",
          details: [{ code: "MEDIA_PROCESSING_FAILED", message: "Unable to process provided media URLs" }]
        }, { 
          status: 400,
          headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
        });
      }
    }
    
    if (params.voice_url) {
      try {
        const voiceFiles = await transformUrlsToMedia([params.voice_url], 'voice');
        files.push(...voiceFiles);
      } catch (error) {
        console.error('Voice URL transformation error:', error);
        return NextResponse.json({
          error: "Failed to process voice URL",
          details: [{ code: "VOICE_PROCESSING_FAILED", message: "Unable to process provided voice URL" }]
        }, { 
          status: 400,
          headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
        });
      }
    }
    
    if (params.avatar_url) {
      try {
        const avatarFiles = await transformUrlsToMedia([params.avatar_url], 'avatar');
        files.push(...avatarFiles);
      } catch (error) {
        console.error('Avatar URL transformation error:', error);
        return NextResponse.json({
          error: "Failed to process avatar URL",
          details: [{ code: "AVATAR_PROCESSING_FAILED", message: "Unable to process provided avatar URL" }]
        }, { 
          status: 400,
          headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
        });
      }
    }

    // 3. Résolution de la voix
    let selectedVoice = null;
    if (params.voice_id) {
      if (!selectedVoice) {
        selectedVoice = voicesConfig.find(v => v.id === params.voice_id);
      }

       if (space.voices) {
        selectedVoice = space.voices.find((v: any) => v.id === params.voice_id);
      }
      
      if (!selectedVoice) {
        return NextResponse.json({
          error: "Invalid voice_id",
          details: [{ code: API_ERROR_CODES.INVALID_VOICE_ID, message: `Voice with ID "${params.voice_id}" not found`, field: "voice_id" }]
        }, { 
          status: 400,
          headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
        });
      }
    }

    // 4. Résolution de l'avatar
    let selectedAvatar = null;
    if (params.avatar_id) {
      if (!selectedAvatar) {
        const avatar = avatarsConfig.find(a => a.id === params.avatar_id);
        if (avatar && avatar.looks?.length > 0) {
          selectedAvatar = avatar.looks[0];
        }
      }

      if (space.avatars) {
        const spaceAvatar = space.avatars.find((a: any) => a.id === params.avatar_id);
        if (spaceAvatar && spaceAvatar.looks?.length > 0) {
          selectedAvatar = spaceAvatar.looks[0];
        }
      }
      
      if (!selectedAvatar) {
        return NextResponse.json({
          error: "Invalid avatar_id",
          details: [{ code: API_ERROR_CODES.INVALID_AVATAR_ID, message: `Avatar with ID "${params.avatar_id}" not found`, field: "avatar_id" }]
        }, { 
          status: 400,
          headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
        });
      }
    }

    // 5. Calcul du coût estimé (seul coût : animation d'images)
    const extractedImagesCount = files.filter(f => f.source === 'extracted').length;
    const estimatedCredits = calculateEstimatedCredits({
      script: finalScript,
      hasAvatar: !!selectedAvatar,
      animateImages: params.animate_image || false,
      animationMode: (params.animate_mode as KlingGenerationMode) || KlingGenerationMode.STANDARD,
      extractedImagesCount
    });

    // 6. Vérification des crédits
    if (space.credits < estimatedCredits) {
      return NextResponse.json({
        error: "Insufficient credits",
        details: [{ 
          code: API_ERROR_CODES.INSUFFICIENT_CREDITS, 
          message: `Required ${estimatedCredits} credits, but only ${space.credits} available` 
        }]
      }, { 
        status: 402,
        headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
      });
    }

    // 7. Préparation des options pour Trigger
    const options = {
      files,
      script: finalScript,
      voice: selectedVoice,
      avatar: selectedAvatar,
      userId: space.ownerId, // Utiliser l'owner du space
      spaceId: space.id,
      webSearch: params.webSearch?.images || false,
      animateImages: params.animate_image || false,
      animationMode: (params.animate_mode as KlingGenerationMode) || KlingGenerationMode.STANDARD,
      format: params.format || 'vertical',
      webhookUrl: params.webhook_url,
      useSpaceMedia: params.use_space_media !== false,
      saveMediaToSpace: params.save_media_to_space !== false
    };

    // 8. Démarrage de la tâche Trigger
    const handle = await tasks.trigger("generate-video", options, {
      tags: [`space:${space.id}`, `api-request`]
    });

    return NextResponse.json({
      data: {
        job_id: handle.id,
        status: 'pending',
        estimated_credits: estimatedCredits
      }
    }, { 
      status: 201,
      headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
    });

  } catch (error: any) {
    console.error('Error in generation start:', error);
    
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

function validateGenerationRequest(params: GenerateVideoRequest): ApiErrorDetail[] {
  const errors: ApiErrorDetail[] = [];

  // Au moins un des paramètres principaux doit être fourni
  if (!params.prompt && !params.script && !params.voice_url && !params.avatar_url) {
    errors.push({
      code: API_ERROR_CODES.MISSING_CONTENT,
      message: "At least one of 'prompt', 'script', 'voice_url', or 'avatar_url' must be provided",
    });
  }

  // Si script mais pas de voix, il faut au moins voice_id ou voice_url
  if (params.script && !params.voice_id && !params.voice_url && !params.avatar_url) {
    errors.push({
      code: API_ERROR_CODES.MISSING_VOICE,
      message: "When providing a script, you must specify either 'voice_id'",
      field: "voice_id"
    });
  }

  // Validation du format
  if (params.format && !['vertical', 'square', 'ads'].includes(params.format)) {
    errors.push({
      code: API_ERROR_CODES.INVALID_FORMAT,
      message: "Format must be one of: 'vertical', 'square', 'ads'",
      field: "format"
    });
  }

  // Validation animate_mode
  if (params.animate_mode && !['standard', 'pro'].includes(params.animate_mode)) {
    errors.push({
      code: API_ERROR_CODES.INVALID_ANIMATE_MODE,
      message: "animate_mode must be either 'standard' or 'pro'",
      field: "animate_mode"
    });
  }

  // Validation des URLs
  if (params.media_urls) {
    params.media_urls.forEach((url, index) => {
      if (!isValidUrl(url)) {
        errors.push({
          code: API_ERROR_CODES.INVALID_MEDIA_URL,
          message: `Invalid URL at index ${index}: ${url}`,
          field: `media_urls[${index}]`
        });
      }
    });
  }

  if (params.voice_url && !isValidUrl(params.voice_url)) {
    errors.push({
      code: API_ERROR_CODES.INVALID_VOICE_URL,
      message: "voice_url must be a valid URL",
      field: "voice_url"
    });
  }

  if (params.avatar_url && !isValidUrl(params.avatar_url)) {
    errors.push({
      code: API_ERROR_CODES.INVALID_AVATAR_URL,
      message: "avatar_url must be a valid URL",
      field: "avatar_url"
    });
  }

  if (params.webhook_url && !isValidUrl(params.webhook_url)) {
    errors.push({
      code: "INVALID_WEBHOOK_URL",
      message: "webhook_url must be a valid URL",
      field: "webhook_url"
    });
  }

  return errors;
}

// Fonction supprimée - maintenant dans /src/lib/video-estimation.ts