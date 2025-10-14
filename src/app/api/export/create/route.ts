import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { createExport } from '@/src/dao/exportDao';
import { IExport } from '@/src/types/export';
import { getSpaceById } from '@/src/dao/spaceDao';
import { ISpace } from '@/src/types/space';
import { IVideo } from '@/src/types/video';
import { getVideoById } from '@/src/dao/videoDao';
import { PlanName } from '@/src/types/enums';
import { calculateAvatarCreditsForUser, calculateTotalAvatarDuration, calculateHighResolutionCostCredits } from '@/src/lib/cost';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/export/create by user: ", session.user.id);

  const params = await req.json();

  const { videoId, spaceId, avatarModel } = params;

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

    // Check if video was created via API (no userId in CREATE step)
    const createEvent = video.history?.find((h: { step: string }) => h.step === 'CREATE');
    const wasCreatedViaAPI = !createEvent?.user;
    
    // Calculate base cost
    const baseCost = wasCreatedViaAPI ? 0 : calculateCredits(video.video?.metadata.audio_duration || 30);

    // Calculate avatar cost if applicable
    let avatarCost = 0;
    const finalAvatarModel = avatarModel || 'heygen';
    if (video.video?.avatar && finalAvatarModel !== 'heygen') {
      const avatarDuration = calculateTotalAvatarDuration(video);
      avatarCost = calculateAvatarCreditsForUser(avatarDuration, finalAvatarModel);
    }

    // Calculate high resolution cost (only for custom format)
    const videoDuration = video.video?.metadata?.audio_duration || 30;
    let highResCost = 0;
    
    if (video.video?.format === 'custom' && video.video?.width && video.video?.height) {
      highResCost = calculateHighResolutionCostCredits(
        videoDuration,
        video.video.width,
        video.video.height
      );
    }

    const totalCost = baseCost + avatarCost + highResCost;

    if (space.credits < totalCost) {
      return NextResponse.json({ error: "not-enough-credits" }, { status: 400 });
    }

    const exportData: IExport = {
      videoId,
      spaceId,
      userId: session.user.id,
      status: 'pending',
      creditCost: totalCost,
      avatarModel: finalAvatarModel
    }

    const exportResult = await createExport(exportData);

    return NextResponse.json({ data: exportResult })
  } catch (error) {
    console.error('Error creating export:', error)
    return NextResponse.json({ error: 'Error creating export' }, { status: 500 })
  }
}

const calculateCredits = (videoDurationInSeconds: number) => {
  // Round up to the nearest 10 seconds
  const roundedDuration = Math.ceil(videoDurationInSeconds / 10) * 10;
  
  // Calculate the number of credits based on the rounded duration with 10s buffer
  const creditsNeeded = Math.max(0.5, Math.ceil((roundedDuration - 10) / 30) * 0.5);
  
  return creditsNeeded * 10;
}