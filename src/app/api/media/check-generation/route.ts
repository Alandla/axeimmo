import { NextRequest, NextResponse } from "next/server";
import { auth } from '@/src/lib/auth';
import { updateMedia } from "@/src/dao/spaceDao";
import { checkKlingRequestStatus, getKlingRequestResult, KlingGenerationMode } from "@/src/lib/fal";
import { IMediaSpace } from "@/src/types/space";
import { analyzeMediaInBackground } from "@/src/service/media-analysis.service";
import { waitUntil } from "@vercel/functions";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/media/check-generation by user: ", session.user.id);

  const { mediaSpace, spaceId } = await req.json();

  if (!mediaSpace || !spaceId) {
    return NextResponse.json(
      { error: "Parameters mediaSpace and spaceId are required" },
      { status: 400 }
    );
  }

  // Vérifier que le media est en génération et a un requestId
  if (mediaSpace.media.generationStatus !== 'generating-video' || !mediaSpace.media.requestId) {
    return NextResponse.json(
      { error: "Media is not in video generation or missing requestId" },
      { status: 400 }
    );
  }

  try {
    // Récupérer le mode de génération ou utiliser STANDARD par défaut
    const generationMode = mediaSpace.media.generationMode || KlingGenerationMode.STANDARD;
    
    // Vérifier le statut de la requête Fal.ai
    console.log(`Checking Fal.ai request status for: ${mediaSpace.media.requestId} with mode: ${generationMode}`);
    const status = await checkKlingRequestStatus(mediaSpace.media.requestId, generationMode);

    console.log("Fal.ai request status:", status.status);

    if (status.status === 'COMPLETED') {
      // Récupérer le résultat
      const result = await getKlingRequestResult(mediaSpace.media.requestId, generationMode);
      
      if (result.data?.video?.url) {
        console.log("Video generation completed, updating media with URL:", result.data.video.url);
        
        // Mettre à jour le media avec la vidéo générée
        const updatedMedia = {
          ...JSON.parse(JSON.stringify(mediaSpace.media)),
          _id: mediaSpace.media.id,
          generationStatus: 'completed',
          video: {
            quality: 'hd',
            file_type: 'mp4',
            size: 0,
            width: result.data.video.width || mediaSpace.media.image?.width || 1920,
            height: result.data.video.height || mediaSpace.media.image?.height || 1080,
            fps: 30,
            link: result.data.video.url,
            frames: [],
            durationInSeconds: 5
          }
        };

        await updateMedia(spaceId, mediaSpace.id!, updatedMedia);
        
        // Créer un objet mediaSpace avec le media mis à jour
        const updatedMediaSpace: IMediaSpace = {
          ...mediaSpace,
          media: {
            ...updatedMedia,
            id: mediaSpace.media.id
          }
        };

        // Lancer l'analyse du media généré pour créer une description en arrière-plan
        console.log('Starting analysis of generated video');
        waitUntil(analyzeMediaInBackground(updatedMediaSpace, spaceId));

        return NextResponse.json({
          data: {
            mediaSpace: updatedMediaSpace,
            status: 'completed'
          }
        });
      } else {
        throw new Error('Video URL not found in Fal.ai response');
      }
    } else if (status.status === 'IN_PROGRESS' || status.status === 'IN_QUEUE') {
      return NextResponse.json({
        data: {
          status: 'in_progress',
          queue_position: status.queue_position
        }
      });
    }

  } catch (error) {
    console.error("Error checking generation status:", error);
    
    // En cas d'erreur, marquer le media comme échoué
    try {
      const failedMedia = {
        ...JSON.parse(JSON.stringify(mediaSpace.media)),
        _id: mediaSpace.media.id,
        generationStatus: 'failed'
      };
      
      await updateMedia(spaceId, mediaSpace.id!, failedMedia);
      
      const failedMediaSpace: IMediaSpace = {
        ...mediaSpace,
        media: {
          ...failedMedia,
          id: mediaSpace.media.id
        }
      };

      return NextResponse.json({
        data: {
          mediaSpace: failedMediaSpace,
          status: 'failed'
        }
      });
    } catch (updateError) {
      console.error('Error updating failed status:', updateError);
    }

    return NextResponse.json(
      { error: "An error occurred while checking generation status" },
      { status: 500 }
    );
  }
} 