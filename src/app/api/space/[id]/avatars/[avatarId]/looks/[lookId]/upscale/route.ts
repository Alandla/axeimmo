import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { isUserInSpace } from "@/src/dao/userDao";
import { getSpaceById, addLookToAvatar } from "@/src/dao/spaceDao";
import { upscaleImageFromUrl } from "@/src/lib/freepik";
import { nanoid } from "nanoid";

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

    const originalLook = avatar.looks?.find((l: any) => l.id === params.lookId);
    if (!originalLook) {
      return NextResponse.json({ error: "Look not found" }, { status: 404 });
    }

    if (!originalLook.thumbnail) {
      return NextResponse.json({ error: "No image to upscale" }, { status: 400 });
    }

    // Create a new look based on the original
    const newLookId = nanoid();
    const lookCount = avatar.looks?.length || 0;
    const newLook = {
      id: newLookId,
      name: `${originalLook.name} (Upscaled)`,
      place: originalLook.place,
      tags: originalLook.tags || [],
      thumbnail: originalLook.thumbnail, // Will be updated by webhook with upscaled version
      previewUrl: originalLook.previewUrl || "",
      videoUrl: originalLook.videoUrl || "",
      createdBy: session.user.id,
      format: originalLook.format || "vertical",
      settings: originalLook.settings || {},
      status: 'pending',
      createdAt: new Date()
    };

    // Add the new look to the avatar
    await addLookToAvatar(params.id, params.avatarId, newLook);

    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : "https://app.hoox.video";
    const webhookUrl = `${baseUrl}/api/webhook/freepik/${params.id}/${params.avatarId}/${newLookId}?x-vercel-protection-bypass=${process.env.VERCEL_AUTOMATION_BYPASS_SECRET}`;

    try {
      await upscaleImageFromUrl({
        image_url: originalLook.thumbnail,
        webhook_url: webhookUrl
      });

      return NextResponse.json({ 
        data: { 
          message: "Upscale started", 
          status: "processing",
          newLookId 
        } 
      });
    } catch (error: any) {
      console.error("Error starting upscale:", error);

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

