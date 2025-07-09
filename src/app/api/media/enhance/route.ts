import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/src/lib/auth';
import { addMediasToSpace, updateMedia, getUserSpaces, removeCreditsToSpace, incrementImageToVideoUsage } from "@/src/dao/spaceDao";
import { waitUntil } from "@vercel/functions";
import { IMediaSpace } from "@/src/types/space";
import { IMedia } from "@/src/types/video";
import { generateKlingAnimation } from "@/src/service/kling-animation.service";
import { KlingGenerationMode, KLING_GENERATION_COSTS } from "@/src/lib/fal";
import { PlanName } from "@/src/types/enums";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/media/enhance by user: ", session.user.id);

  const { mediaSpace, spaceId, type, context, mode = KlingGenerationMode.STANDARD } = await req.json();

  if (!mediaSpace || !spaceId || !type) {
    return NextResponse.json(
      { error: "Parameters mediaSpace, spaceId and type are required" },
      { status: 400 }
    );
  }

  // Valider et typer le mode de génération
  const generationMode: KlingGenerationMode = mode;
  if (type === 'video' && !Object.values(KlingGenerationMode).includes(generationMode)) {
    return NextResponse.json(
      { error: "Invalid generation mode" },
      { status: 400 }
    );
  }

  try {
    // Récupérer les espaces de l'utilisateur pour vérifier les crédits et limites
    const userSpaces = await getUserSpaces(session.user.id);
    console.log("userSpaces: ", userSpaces);
    const currentSpace = userSpaces.find(space => space.id === spaceId);

    console.log("currentSpace: ", currentSpace);
    
    if (!currentSpace) {
      return NextResponse.json(
        { error: "Space not found" },
        { status: 404 }
      );
    }

    // Vérifier les crédits pour la génération vidéo
    if (type === 'video') {
      const requiredCredits = KLING_GENERATION_COSTS[generationMode];
      
      if (currentSpace.credits < requiredCredits) {
        return NextResponse.json(
          { error: "Insufficient credits", required: requiredCredits, available: currentSpace.credits },
          { status: 402 }
        );
      }

      // Vérifier les limites de génération pour les plans non-entreprise
      if (currentSpace.planName !== PlanName.ENTREPRISE) {
        const remainingGenerations = (currentSpace.imageToVideoLimit || 0) - (currentSpace.imageToVideoUsed || 0);
        if (remainingGenerations <= 0) {
          return NextResponse.json(
            { error: "Generation limit reached", limit: currentSpace.imageToVideoLimit, used: currentSpace.imageToVideoUsed },
            { status: 403 }
          );
        }
      }

      // Vérifier l'accès au mode PRO/Ultra
      if (generationMode === KlingGenerationMode.PRO && currentSpace.planName !== PlanName.ENTREPRISE) {
        return NextResponse.json(
          { error: "Mode PRO requires Enterprise plan" },
          { status: 403 }
        );
      }
    }

    // Créer immédiatement un nouvel asset en génération
    const enhancedMedia: IMedia = {
      type: type === 'video' ? 'video' as const : 'image' as const,
      usage: 'media' as const,
      name: `${type === 'video' ? 'Generated Video' : 'Enhanced'} - ${mediaSpace.media.name}`,
      generationStatus: type === 'video' ? 'generating-video' : 'generating-image',
      generationMode: type === 'video' ? generationMode : undefined,
      ...(type === 'video' ? {
        // Si on génère une vidéo, on utilise l'image originale comme base
        image: mediaSpace.media.image ? { ...mediaSpace.media.image } : undefined,
        video: {
          quality: 'hd',
          file_type: 'mp4',
          size: 0,
          width: mediaSpace.media.image?.width || 1920,
          height: mediaSpace.media.image?.height || 1080,
          fps: 30,
          link: '', // Will be filled after generation
          frames: [],
          durationInSeconds: 0
        }
      } : { // Si on améliore une image
        image: { // Créer nouvelle structure image basée sur l'originale
          ...(mediaSpace.media.image || {}), // Copier l'image existante si elle existe
          link: '',
          width: mediaSpace.media.image?.width || 1920,
          height: mediaSpace.media.image?.height || 1080,
          size: 0
        },
        // Garder la vidéo originale si elle existait et qu'on améliore l'image
        video: mediaSpace.media.video ? { ...mediaSpace.media.video } : undefined,
      })
    };

    const newMediaSpace: IMediaSpace = {
      media: enhancedMedia,
      uploadedBy: session.user.id,
      uploadedAt: new Date(),
      autoPlacement: true,
      baseMediaId: mediaSpace.id
    };

    // Ajouter le media en génération à l'espace
    const addedMedias = await addMediasToSpace(spaceId, [newMediaSpace]);
    
    // Récupérer le media nouvellement ajouté avec son vrai ID MongoDB
    const addedMedia = addedMedias[addedMedias.length - 1]; // Le dernier ajouté

    console.log("Added media: ", addedMedia);
    
    // Démarrer la génération en arrière-plan avec le vrai ID
    waitUntil(enhanceMediaInBackground(addedMedia, spaceId, context, type, generationMode));

    return NextResponse.json( {
      data: {
        success: true,
        message: "Enhancement started",
        mediaSpace: addedMedia
      }
    });
  } catch (error) {
    console.error("Error processing enhancement request:", error);
    return NextResponse.json(
      { error: "An error occurred while processing the enhancement request" },
      { status: 500 }
    );
  }
}

// Fonction qui s'exécute en arrière-plan pour la génération
async function enhanceMediaInBackground(
  mediaSpace: IMediaSpace, 
  spaceId: string, 
  context: string, 
  type: 'video' | 'image',
  mode: KlingGenerationMode = KlingGenerationMode.STANDARD
) {
  try {
    console.log(`Starting ${type} enhancement for media ${mediaSpace.id} with mode: ${mode}`);
    
    if (type === 'video') {
      // Obtenir l'URL de l'image source
      const imageUrl = mediaSpace.media.image?.link;
      
      if (!imageUrl) {
        throw new Error('Image URL not found for video generation');
      }

      console.log('Generating animation prompt for image:', imageUrl);
      
      // Générer l'animation avec le service Kling
      const animationResult = await generateKlingAnimation({
        imageUrl,
        context,
        imageWidth: mediaSpace.media.image?.width || 1920,
        imageHeight: mediaSpace.media.image?.height || 1080,
        duration: "5",
        mode: mode
      });
      
      console.log('Generated animation with request ID:', animationResult.request_id);

      if (type === 'video') {
        const requiredCredits = KLING_GENERATION_COSTS[mode as KlingGenerationMode];

        await removeCreditsToSpace(spaceId, requiredCredits);
        await incrementImageToVideoUsage(spaceId);
      }
      
      console.log('Fal.ai request submitted with ID:', animationResult.request_id);
      
      // Mettre à jour le media avec le requestId
      const updatedMedia = {
        ...JSON.parse(JSON.stringify(mediaSpace.media)),
        _id: mediaSpace.media.id,
        requestId: animationResult.request_id,
        generationMode: mode
      };
      
      await updateMedia(spaceId, mediaSpace.id!, updatedMedia);
      console.log(`Video generation request started for media ${mediaSpace.id} with request ID: ${animationResult.request_id} and mode: ${mode}`);
      
    }

  } catch (error) {
    console.error(`Error during ${type} enhancement:`, error);
    
    // En cas d'erreur, mettre à jour le statut à 'failed'
    try {
      const failedMedia = {
        ...JSON.parse(JSON.stringify(mediaSpace.media)),
        _id: mediaSpace.media.id,
        generationStatus: 'failed',
      };
      
      await updateMedia(spaceId, mediaSpace.id!, failedMedia);
    } catch (updateError) {
      console.error('Error updating failed status:', updateError);
    }
  }
} 