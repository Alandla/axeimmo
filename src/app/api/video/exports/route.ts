import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { getExportsByVideoId } from '@/src/dao/exportDao';
import { getVideoById } from '@/src/dao/videoDao';
import { isUserInSpace } from '@/src/dao/userDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/video/exports by user: ", session.user.id);

  try {
    const { videoId } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    // Vérifier que la vidéo existe et que l'utilisateur a accès
    const video = await getVideoById(videoId);
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est dans l'espace de la vidéo
    const userIsInSpace = await isUserInSpace(session.user.id, video.spaceId);
    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Récupérer les URLs de téléchargement des exports
    const downloadUrls = await getExportsByVideoId(videoId);

    return NextResponse.json({ data: downloadUrls });
  } catch (error) {
    console.error('Error getting video exports:', error);
    return NextResponse.json({ error: 'Error getting video exports' }, { status: 500 });
  }
} 