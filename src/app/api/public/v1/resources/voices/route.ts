import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, ApiError, API_ERROR_CODES } from '@/src/lib/api-auth'
import { applyRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limiting'
import { voicesConfig } from '@/src/config/voices.config'
import { PlanName } from '@/src/types/enums'

export async function GET(req: NextRequest) {
  try {
    const { space, apiKey } = await authenticateApiKey(req);
    
    // Rate limiting
    const { remaining, resetTime } = await applyRateLimit(space.id, apiKey.rateLimitPerMinute);
    
    console.trace(`GET /api/public/v1/resources/voices by space: ${space.id}`);

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language');
    const gender = searchParams.get('gender');
    const tags = searchParams.get('tags')?.split(',');

    // Récupérer les voix du space (personnalisées) en premier
    let allVoices = [];
    
    if (space.voices && space.voices.length > 0) {
      allVoices.push(...space.voices.map((voice: any) => ({
        ...voice,
        source: 'space'
      })));
    }
    
    // Filtrer les voix de la config selon le plan
    const configVoices = voicesConfig.filter(voice => {
      switch (space.plan?.name) {
        case PlanName.FREE:
          return voice.plan === PlanName.FREE;
        case PlanName.START:
          return [PlanName.FREE, PlanName.START].includes(voice.plan);
        case PlanName.PRO:
          return [PlanName.FREE, PlanName.START, PlanName.PRO].includes(voice.plan);
        case PlanName.ENTREPRISE:
          return true; // Accès à toutes les voix
        default:
          return voice.plan === PlanName.FREE;
      }
    });

    // Ajouter les voix de la config
    allVoices.push(...configVoices.map(voice => ({
      ...voice,
      source: 'config'
    })));

    // Appliquer les filtres
    let filteredVoices = allVoices;

    if (language) {
      filteredVoices = filteredVoices.filter(voice => 
        voice.language.toLowerCase() === language.toLowerCase()
      );
    }

    if (gender) {
      filteredVoices = filteredVoices.filter(voice => 
        voice.gender === gender
      );
    }

    if (tags && tags.length > 0) {
      filteredVoices = filteredVoices.filter(voice => 
        voice.tags.some((tag: string) => tags.includes(tag))
      );
    }

    // Formater la réponse
    const formattedVoices = filteredVoices.map(voice => ({
      id: voice.id,
      name: voice.name,
      language: voice.language,
      accent: voice.accent,
      gender: voice.gender,
      tags: voice.tags,
      preview: voice.previewUrl,
    }));

    return NextResponse.json(formattedVoices, {
      headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
    });

  } catch (error: any) {
    console.error('Error in voices list:', error);
    
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