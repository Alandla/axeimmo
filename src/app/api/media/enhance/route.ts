import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/src/lib/auth';
import { addMediasToSpace, updateMedia } from "@/src/dao/spaceDao";
import { waitUntil } from "@vercel/functions";
import { IMediaSpace } from "@/src/types/space";
import { IMedia } from "@/src/types/video";
import { generateKlingAnimationPrompt } from "@/src/lib/workflowai";
import { startKlingVideoGeneration, KlingGenerationMode } from "@/src/lib/fal";

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

  // Valider le mode de génération
  if (type === 'video' && !Object.values(KlingGenerationMode).includes(mode)) {
    return NextResponse.json(
      { error: "Invalid generation mode" },
      { status: 400 }
    );
  }

  try {
    // Créer immédiatement un nouvel asset en génération
    const enhancedMedia: IMedia = {
      type: type === 'video' ? 'video' as const : 'image' as const,
      usage: 'media' as const,
      name: `${type === 'video' ? 'Generated Video' : 'Enhanced'} - ${mediaSpace.media.name}`,
      generationStatus: type === 'video' ? 'generating-video' : 'generating-image',
      generationMode: type === 'video' ? mode : undefined,
      description: [{
        start: 0,
        text: context.substring(0, 200)
      }],
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
    waitUntil(enhanceMediaInBackground(addedMedia, spaceId, context, type, mode));

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
      
      // Générer le prompt d'animation avec WorkflowAI
      const promptResult = await generateKlingAnimationPrompt(
        imageUrl,
        context // Contexte utilisé comme prompt de base
      );
      
      console.log('Generated animation prompt:', promptResult.enhancedPrompt);
      console.log('Prompt generation cost:', promptResult.cost);
      
      // Démarrer la génération vidéo avec Fal.ai
      console.log(`Starting Kling video generation with mode: ${mode}`);
      const falResult = await startKlingVideoGeneration({
        prompt: promptResult.enhancedPrompt,
        image_url: imageUrl,
        duration: "5",
        aspect_ratio: "16:9"
      }, mode);
      
      console.log('Fal.ai request submitted with ID:', falResult.request_id);
      
      // Mettre à jour le media avec le requestId
      const updatedMedia = {
        ...JSON.parse(JSON.stringify(mediaSpace.media)),
        _id: mediaSpace.media.id,
        requestId: falResult.request_id,
        generationMode: mode
      };
      
      await updateMedia(spaceId, mediaSpace.id!, updatedMedia);
      console.log(`Video generation request started for media ${mediaSpace.id} with request ID: ${falResult.request_id} and mode: ${mode}`);
      
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