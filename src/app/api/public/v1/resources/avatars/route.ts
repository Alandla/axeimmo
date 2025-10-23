import { NextRequest, NextResponse } from 'next/server'
import { authenticateApiKey, ApiError, API_ERROR_CODES } from '@/src/lib/api-auth'
import { applyRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limiting'
import { avatarsConfig } from '@/src/config/avatars.config'

export async function GET(req: NextRequest) {
  try {
    const { space, apiKey } = await authenticateApiKey(req);
    
    // Rate limiting
    const { remaining, resetTime } = await applyRateLimit(space.id, apiKey.rateLimitPerMinute);
    
    console.info(`GET /api/public/v1/resources/avatars by space: ${space.id}`);

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(req.url);
    const gender = searchParams.get('gender');
    const tags = searchParams.get('tags')?.split(',');

    // Récupérer tous les looks directement (pas les avatars)
    let allLooks: any[] = [];
    
    // Ajouter les looks des avatars du space
    if (space.avatars && space.avatars.length > 0) {
      space.avatars.forEach((avatar: any) => {
        if (avatar.looks) {
          avatar.looks.forEach((look: any) => {
            allLooks.push({
              ...look,
              gender: avatar.gender,
              tags: avatar.tags,
            });
          });
        }
      });
    }
    
    // Ajouter les looks des avatars de la config
    avatarsConfig.forEach(avatar => {
      if (avatar.looks) {
        avatar.looks.forEach((look: any) => {
          allLooks.push({
            ...look,
            gender: avatar.gender,
            tags: avatar.tags,
          });
        });
      }
    });

    // Appliquer les filtres
    let filteredLooks = allLooks;

    if (gender) {
      filteredLooks = filteredLooks.filter(look => 
        look.gender === gender
      );
    }

    if (tags && tags.length > 0) {
      filteredLooks = filteredLooks.filter(look => 
        look.tags?.some((tag: string) => tags.includes(tag))
      );
    }

    // Formater la réponse
    const formattedLooks = filteredLooks.map(look => {
      // Déterminer les modèles disponibles en fonction de la présence de previewUrl
      // On retourne les noms publics des modèles
      const modelAvailable = look.previewUrl 
        ? ['standard'] // Si previewUrl existe, seul le mode standard est disponible
        : ['premium', 'ultra', 'veo-3', 'veo-3-fast']; // Sinon, tous les autres modes sont disponibles
      
      return {
        id: look.id,
        name: look.name,
        gender: look.gender,
        place: look.place,
        format: look.format,
        tags: look.tags,
        thumbnail: look.thumbnail,
        preview: look.previewUrl,
        model_available: modelAvailable,
      };
    });

    return NextResponse.json(formattedLooks, {
      headers: getRateLimitHeaders(remaining, resetTime, apiKey.rateLimitPerMinute)
    });

  } catch (error: any) {
    console.error('Error in avatars list:', error);
    
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