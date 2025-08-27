import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, ApiError, API_ERROR_CODES } from '@/src/lib/api-auth'
import { applyRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limiting'
import { generateVideoScriptDirect, calculateScriptGenerationCost } from '@/src/lib/script-generation'
import { removeCreditsToSpace } from '@/src/dao/spaceDao'

interface GenerateScriptRequest {
  prompt: string;
  duration?: number;
  urls?: string[];
  webSearch?: boolean;
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
    
    const params: GenerateScriptRequest = await req.json();
    
    // Validation des paramètres
    const errors = validateScriptRequest(params);
    if (errors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: errors 
        }, 
        { status: 400 }
      );
    }

    console.info(`POST /api/public/v1/script/generate by space: ${space.id}, API key: ${apiKey.id}`);

    const { prompt, duration = 60, urls = [], webSearch = false } = params;

    // Calculer le coût estimé avant la génération
    const estimatedCost = calculateScriptGenerationCost({
      duration,
      urls,
      webSearch
    });

    console.info(`Estimated cost: ${estimatedCost} credits for space ${space.id}`);

    // Vérifier si l'espace a suffisamment de crédits
    if (space.credits < estimatedCost) {
      throw new ApiError(
        `Insufficient credits. Required: ${estimatedCost}, Available: ${space.credits}`,
        402,
        API_ERROR_CODES.INSUFFICIENT_CREDITS
      );
    }

    // Génération du script avec extraction d'URLs et d'images (version directe sans streaming)
    const result = await generateVideoScriptDirect({
      prompt,
      duration,
      urls,
      webSearch,
      planName: space.planName
    });

    const realCost = result.cost || 0;
    const finalExtractedImages = result.extractedImages;

    console.info(`Costs - Charged to client: ${estimatedCost} credits, Real cost for us: ${realCost} credits`);
    console.info(`Extracted ${finalExtractedImages.length} images from URLs`);

    // Débiter seulement le coût facturé (estimatedCost) au space
    await removeCreditsToSpace(space.id, estimatedCost);

    console.info(`Successfully debited ${estimatedCost} credits from space ${space.id} (real cost: ${realCost})`);

    // Préparer la réponse
    const response = {
      script: result.script,
      cost: estimatedCost, // Le client voit le coût facturé
      extractedImages: finalExtractedImages
    };

    // Ajouter les headers de rate limiting
    const rateLimitHeaders = getRateLimitHeaders(remaining, resetTime);
    const headers = new Headers(rateLimitHeaders);
    headers.set('Content-Type', 'application/json');

    return NextResponse.json(response, { headers });

  } catch (error) {
    console.error('Error generating script:', error);
    
    if (error instanceof ApiError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code 
        }, 
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: API_ERROR_CODES.INTERNAL_ERROR 
      }, 
      { status: 500 }
    );
  }
}

function validateScriptRequest(params: GenerateScriptRequest): ApiErrorDetail[] {
  const errors: ApiErrorDetail[] = [];

  // Validation du prompt (obligatoire)
  if (!params.prompt) {
    errors.push({
      code: API_ERROR_CODES.MISSING_FIELD,
      message: 'Prompt is required',
      field: 'prompt'
    });
  } else if (typeof params.prompt !== 'string') {
    errors.push({
      code: API_ERROR_CODES.INVALID_TYPE,
      message: 'Prompt must be a string',
      field: 'prompt'
    });
  } else if (params.prompt.trim().length === 0) {
    errors.push({
      code: API_ERROR_CODES.INVALID_VALUE,
      message: 'Prompt cannot be empty',
      field: 'prompt'
    });
  } else if (params.prompt.length > 10000) {
    errors.push({
      code: API_ERROR_CODES.INVALID_VALUE,
      message: 'Prompt must be less than 10,000 characters',
      field: 'prompt'
    });
  }

  // Validation de la durée (optionnelle)
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

  // Validation des URLs (optionnelles)
  if (params.urls !== undefined) {
    if (!Array.isArray(params.urls)) {
      errors.push({
        code: API_ERROR_CODES.INVALID_TYPE,
        message: 'URLs must be an array',
        field: 'urls'
      });
    } else if (params.urls.length > 10) {
      errors.push({
        code: API_ERROR_CODES.INVALID_VALUE,
        message: 'Maximum 10 URLs allowed',
        field: 'urls'
      });
    } else {
      // Valider chaque URL
      params.urls.forEach((url, index) => {
        if (typeof url !== 'string') {
          errors.push({
            code: API_ERROR_CODES.INVALID_TYPE,
            message: `URL at index ${index} must be a string`,
            field: `urls[${index}]`
          });
        } else {
          try {
            new URL(url);
          } catch {
            errors.push({
              code: API_ERROR_CODES.INVALID_VALUE,
              message: `URL at index ${index} is not a valid URL`,
              field: `urls[${index}]`
            });
          }
        }
      });
    }
  }

  // Validation de webSearch (optionnel)
  if (params.webSearch !== undefined && typeof params.webSearch !== 'boolean') {
    errors.push({
      code: API_ERROR_CODES.INVALID_TYPE,
      message: 'webSearch must be a boolean',
      field: 'webSearch'
    });
  }

  return errors;
}