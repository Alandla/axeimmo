import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById, updateLookInAvatar } from "@/src/dao/spaceDao";
import { upscaleImageFromUrl } from "@/src/lib/freepik";
import { eventBus } from "@/src/lib/events";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; avatarId: string; lookId: string } }
) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/[id]/avatars/[avatarId]/looks/[lookId]/upscale by user: ", session.user.id);

  try {
    const userIsInSpace: boolean = await isUserInSpace(
      session.user.id,
      params.id
    );

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const space: any = await getSpaceById(params.id);
    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    const avatar = space.avatars?.find((a: any) => a.id === params.avatarId);
    if (!avatar) {
      return NextResponse.json({ error: "Avatar not found" }, { status: 404 });
    }

    const look = avatar.looks?.find((l: any) => l.id === params.lookId);
    if (!look) {
      return NextResponse.json({ error: "Look not found" }, { status: 404 });
    }

    if (!look.thumbnail) {
      return NextResponse.json({ error: "No image to upscale" }, { status: 400 });
    }

    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "https://app.hoox.video";
    const webhookUrl = `${baseUrl}/api/webhook/freepik/${params.id}/${params.avatarId}/${params.lookId}`;

    await updateLookInAvatar(params.id, params.avatarId, params.lookId, {
      status: 'pending'
    });

    try {
      eventBus.emit('look.updated', { 
        spaceId: params.id, 
        avatarId: params.avatarId, 
        lookId: params.lookId, 
        status: 'pending' 
      });
    } catch {}

    try {
      await upscaleImageFromUrl({
        image_url: look.thumbnail,
        webhook_url: webhookUrl
      });

      return NextResponse.json({ 
        data: { 
          message: "Upscale started", 
          status: "processing" 
        } 
      });
    } catch (error: any) {
      console.error("Error starting upscale:", error);
      
      await updateLookInAvatar(params.id, params.avatarId, params.lookId, {
        status: 'error',
        errorMessage: error.message || 'Failed to start upscale'
      });

      try {
        eventBus.emit('look.updated', { 
          spaceId: params.id, 
          avatarId: params.avatarId, 
          lookId: params.lookId, 
          status: 'error' 
        });
      } catch {}

      return NextResponse.json({ 
        error: "Failed to start upscale" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error upscaling look:", error);
    return NextResponse.json(
      { error: "Error upscaling look" },
      { status: 500 }
    );
  }
}

