import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, ApiError, API_ERROR_CODES, isValidUrl } from '@/src/lib/api-auth'
import { applyRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limiting'
import { generateVideoScriptDirect } from '@/src/lib/script-generation'
import { transformUrlsToMedia } from '@/src/lib/media-transformer'
import { voicesConfig } from '@/src/config/voices.config'
import { avatarsConfig } from '@/src/config/avatars.config'
import { tasks } from '@trigger.dev/sdk/v3'
import { KlingGenerationMode } from '@/src/lib/fal'
import { calculateEstimatedCredits, calculateRequiredMachine } from '@/src/lib/video-estimation'
import { PlanName } from '@/src/types/enums'

interface GenerateVideoRequest {
  prompt?: string;
  duration?: number;
  web_urls?: string[];
  script?: string;
  voice_id?: string;
  voice_url?: string;
  avatar_id?: string;
  avatar_url?: string;
  format?: 'vertical' | 'square' | 'ads' | 'custom';
  width?: number;
  height?: number;
  media_urls?: string[];
  web_search?: {
    script?: boolean;
    images?: boolean;
  };
  animate_image?: boolean;
  animate_mode?: 'standard' | 'pro';
  animate_image_max?: number;
  webhook_url?: string;
  use_space_media?: boolean;
  save_media_to_space?: boolean;
  emotion_enhancement?: boolean;
  use_veo3?: boolean;
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

    console.info(`POST /api/public/v1/generation/start by space: ${space.id}`);
    console.info('params', params);

    // 1. Initialisation des variables
    let finalScript = params.script || '';
    let files: any[] = [];

    // 2. Gestion du script
    if (!finalScript && params.prompt && !params.voice_url && !params.avatar_url) {
      console.info("Generating script from prompt...");
      try {
        // Génération du script avec extraction d'URLs et d'images (version directe sans streaming)
        const result = await generateVideoScriptDirect({
          prompt: params.prompt,
          duration: params.duration || 30,
          urls: params.web_urls || [],
          webSearch: params.web_search?.script || false,
          planName: space.planName
        });

        finalScript = result.script;
        
        // Traiter les images extraites si il y en a
        if (result.extractedImages.length > 0) {
          try {
            const imageFiles = await transformUrlsToMedia(result.extractedImages, 'media');
            files.push(...imageFiles.map(file => ({ ...file, source: 'extracted' })));
          } catch (error) {
            console.error('Error processing extracted images:', error);
            // Ne pas faire échouer la génération si les images ne peuvent pas être traitées
          }
        }
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

    // 3. Transformation des médias
    
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

      if (!selectedVoice && space.voices) {
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

    // 4. Résolution de l'avatar (avatar_id correspond à un look.id)
    let selectedAvatar = null;
    if (params.avatar_id) {      
      // Recherche optimisée dans les avatars de configuration
      for (const avatar of avatarsConfig) {
        if (avatar.look_ids?.includes(params.avatar_id)) {
          const look = avatar.looks?.find(look => look.id === params.avatar_id);
          if (look) {
            selectedAvatar = look;
            break;
          }
        }
      }

      // Recherche dans les avatars du space si pas trouvé (méthode classique)
      if (!selectedAvatar && space.avatars) {
        for (const avatar of space.avatars) {
          const look = avatar.looks?.find((look: any) => look.id === params.avatar_id);
          if (look) {
            selectedAvatar = look;
            break;
          }
        }
      }
      
      if (!selectedAvatar) {
        return NextResponse.json({
          error: "Invalid avatar_id",
          details: [{ code: API_ERROR_CODES.INVALID_AVATAR_ID, message: `Avatar look with ID "${params.avatar_id}" not found`, field: "avatar_id" }]
        }, { 
          status: 400,
          headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
        });
      }
    }

    // 5. Calcul du coût estimé
    const extractedImagesCount = files.filter(f => f.source === 'extracted').length;
    const estimatedCredits = calculateEstimatedCredits({
      script: finalScript,
      hasAvatar: !!selectedAvatar,
      animateImages: params.animate_image || false,
      animationMode: (params.animate_mode as KlingGenerationMode) || KlingGenerationMode.STANDARD,
      extractedImagesCount,
      duration: params.duration // Utiliser la durée fournie si disponible
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
    // Vérifier si le plan permet l'animation d'images (Pro ou Entreprise uniquement)
    const canAnimateImages = space.plan?.name === PlanName.PRO || space.plan?.name === PlanName.ENTREPRISE;
    const shouldAnimateImages = (params.animate_image || false) && canAnimateImages;
    
    // Gestion des dimensions custom
    const videoFormat = params.format || 'vertical';
    const videoWidth = videoFormat === 'custom' ? (params.width || 1080) : undefined;
    const videoHeight = videoFormat === 'custom' ? (params.height || 1920) : undefined;
    
    const options = {
      files,
      script: finalScript,
      voice: selectedVoice,
      avatar: selectedAvatar,
      userId: space.ownerId, // Utiliser l'owner du space
      spaceId: space.id,
      webSearch: params.web_search?.images || false,
      animateImages: shouldAnimateImages,
      animationMode: (params.animate_mode as KlingGenerationMode) || KlingGenerationMode.STANDARD,
      emotionEnhancement: params.emotion_enhancement || false,
      useVeo3: params.use_veo3 || false,
      format: videoFormat,
      width: videoWidth,
      height: videoHeight,
      webhookUrl: params.webhook_url,
      useSpaceMedia: params.use_space_media !== false,
      saveMediaToSpace: params.save_media_to_space !== false,
      deductCredits: true // API publique : déduire les crédits du space
    };

    console.info('options', options);

    // 8. Calcul de la machine nécessaire selon la taille des vidéos
    const videoFiles = files.filter(f => f.type === 'video');
    const machinePreset = calculateRequiredMachine(videoFiles);
    
    console.info(`[MACHINE] Using machine preset: ${machinePreset} for ${videoFiles.length} video(s)`);

    // 9. Démarrage de la tâche Trigger
    const handle = await tasks.trigger("generate-video", options, {
      tags: [`space:${space.id}`, `api-request`],
      machine: machinePreset
    });

    return NextResponse.json({
      job_id: handle.id,
      status: 'pending',
      estimated_credits: estimatedCredits
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

  // Si prompt est fourni, duration est obligatoire
  if (params.prompt && !params.duration) {
    errors.push({
      code: API_ERROR_CODES.MISSING_FIELD,
      message: "When providing a prompt, duration is required",
      field: "duration"
    });
  }

  // Validation de la durée
  if (params.duration !== undefined) {
    if (typeof params.duration !== 'number') {
      errors.push({
        code: API_ERROR_CODES.INVALID_TYPE,
        message: 'Duration must be a number',
        field: 'duration'
      });
    } else if (params.duration < 10 || params.duration > 600) {
      errors.push({
        code: API_ERROR_CODES.INVALID_VALUE,
        message: 'Duration must be between 10 and 600 seconds',
        field: 'duration'
      });
    }
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
  if (params.format && !['vertical', 'square', 'ads', 'custom'].includes(params.format)) {
    errors.push({
      code: API_ERROR_CODES.INVALID_FORMAT,
      message: "Format must be one of: 'vertical', 'square', 'ads', 'custom'",
      field: "format"
    });
  }

  // Validation des dimensions custom
  if (params.width !== undefined) {
    if (typeof params.width !== 'number' || params.width < 1 || params.width > 5000) {
      errors.push({
        code: API_ERROR_CODES.INVALID_VALUE,
        message: 'Width must be a number between 1 and 5000',
        field: 'width'
      });
    }
  }

  if (params.height !== undefined) {
    if (typeof params.height !== 'number' || params.height < 1 || params.height > 5000) {
      errors.push({
        code: API_ERROR_CODES.INVALID_VALUE,
        message: 'Height must be a number between 1 and 5000',
        field: 'height'
      });
    }
  }

  // Validation animate_mode
  if (params.animate_mode && !['standard', 'pro'].includes(params.animate_mode)) {
    errors.push({
      code: API_ERROR_CODES.INVALID_ANIMATE_MODE,
      message: "animate_mode must be either 'standard' or 'pro'",
      field: "animate_mode"
    });
  }

  // Validation des web_urls
  if (params.web_urls) {
    if (!Array.isArray(params.web_urls)) {
      errors.push({
        code: API_ERROR_CODES.INVALID_TYPE,
        message: 'web_urls must be an array',
        field: 'web_urls'
      });
    } else if (params.web_urls.length > 10) {
      errors.push({
        code: API_ERROR_CODES.INVALID_VALUE,
        message: 'Maximum 10 URLs allowed in web_urls',
        field: 'web_urls'
      });
    } else {
      params.web_urls.forEach((url, index) => {
        if (typeof url !== 'string') {
          errors.push({
            code: API_ERROR_CODES.INVALID_TYPE,
            message: `URL at index ${index} in web_urls must be a string`,
            field: `web_urls[${index}]`
          });
        } else if (!isValidUrl(url)) {
          errors.push({
            code: API_ERROR_CODES.INVALID_VALUE,
            message: `URL at index ${index} in web_urls is not a valid URL`,
            field: `web_urls[${index}]`
          });
        }
      });
    }
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