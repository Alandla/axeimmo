import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { getVideoById, updateVideoThumbnail } from '@/src/dao/videoDao';
import { generateThumbnail } from '@/src/lib/render';
import { IVideo } from '@/src/types/video';
import { waitUntil } from '@vercel/functions';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/video/generateThumbnail by user: ", session.user.id);

  const params = await req.json();
  const { videoId } = params;

  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  try {
    // On récupère la vidéo
    const video = await getVideoById(videoId);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Utilisation de waitUntil pour s'assurer que la génération de la vignette 
    // se termine même après l'envoi de la réponse
    waitUntil(generateThumbnailAndUpdate(video, videoId));

    // Répondre immédiatement que le processus a commencé
    return NextResponse.json({ 
      data: { 
        success: true,
        message: "Génération de vignette lancée en arrière-plan"
      } 
    });
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    return NextResponse.json({ error: 'Error generating thumbnail' }, { status: 500 });
  }
}

// Fonction séparée pour être utilisée avec waitUntil
async function generateThumbnailAndUpdate(video: IVideo, videoId: string) {
  try {
    // Génération de la vignette
    const thumbnail = await generateThumbnail(video);

    if (thumbnail && videoId) {
      // Utilisation de la fonction spécifique qui n'affecte que la vignette et le coût
      await updateVideoThumbnail(
        videoId, 
        thumbnail.url, 
        thumbnail.estimatedPrice.accruedSoFar
      );
      console.log(`Vignette générée et mise à jour pour la vidéo ${videoId}`);
    }
  } catch (error) {
    console.error('Error in background thumbnail generation:', error);
  }
}