import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { createExport } from '@/src/dao/exportDao';
import { IExport } from '@/src/types/export';
import { getSpaceById } from '@/src/dao/spaceDao';
import { ISpace } from '@/src/types/space';
import { IVideo } from '@/src/types/video';
import { getVideoById } from '@/src/dao/videoDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/export/create by user: ", session.user.id);

  const params = await req.json();

  const { videoId, spaceId } = params;

  try {

    const space : ISpace = await getSpaceById(spaceId);

    if (!space) {
      return NextResponse.json({ error: "space-not-found" }, { status: 404 });
    }

    const video : IVideo | null = await getVideoById(videoId);

    if (!video) {
      return NextResponse.json({ error: "video-not-found" }, { status: 404 });
    }

    if (video.spaceId.toString() !== spaceId) {
      return NextResponse.json({ error: "video-not-in-space" }, { status: 400 });
    }

    const cost = calculateCredits(video.video?.metadata.audio_duration || 30)

    if (space.credits < cost) {
      return NextResponse.json({ error: "not-enough-credits" }, { status: 400 });
    }

    const exportData: IExport = {
      videoId,
      spaceId,
      userId: session.user.id,
      status: 'pending',
      creditCost: cost
    }

    const exportResult = await createExport(exportData);

    return NextResponse.json({ data: exportResult })
  } catch (error) {
    console.error('Error creating export:', error)
    return NextResponse.json({ error: 'Error creating export' }, { status: 500 })
  }
}

const calculateCredits = (videoDurationInSeconds: number) => {
  // Round up to the nearest 15 seconds
  const roundedDuration = Math.ceil(videoDurationInSeconds / 15) * 15;
  
  // Calculate the number of credits based on the rounded duration
  const creditsNeeded = Math.max(0.5, Math.ceil((roundedDuration - 15) / 30) * 0.5);
  
  return creditsNeeded * 10;
}