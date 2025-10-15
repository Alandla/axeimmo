import { NextRequest, NextResponse } from "next/server";
import { updateLookInAvatar } from "@/src/dao/spaceDao";
import { uploadImageFromUrlToS3 } from "@/src/lib/r2";
import { eventBus } from "@/src/lib/events";
import connectMongo from "@/src/lib/mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: { spaceId: string; avatarId: string; lookId: string } }
) {
  console.log("POST /api/webhook/freepik/[spaceId]/[avatarId]/[lookId] - Received upscale result");

  try {
    await connectMongo();

    const body = await req.json();
    console.log("Freepik webhook payload:", JSON.stringify(body, null, 2));

    const { spaceId, avatarId, lookId } = params;
    
    if (!spaceId || !avatarId || !lookId) {
      console.error("Missing path parameters in webhook URL");
      return NextResponse.json({ error: "Missing path parameters" }, { status: 400 });
    }

    const status = body?.status;
    const generatedImages = body?.generated;
    const imageUrl = Array.isArray(generatedImages) && generatedImages.length > 0 
      ? generatedImages[0] 
      : null;

    if (status === "COMPLETED" && imageUrl) {
      const fileName = `avatar-look-${lookId}-upscaled-${Date.now()}`;
      const savedUrl = await uploadImageFromUrlToS3(imageUrl, "medias-users", fileName);
      
      await updateLookInAvatar(spaceId, avatarId, lookId, {
        thumbnail: savedUrl,
        status: 'ready'
      });

      try {
        eventBus.emit('look.updated', { 
          spaceId, 
          avatarId, 
          lookId, 
          status: 'ready' 
        });
      } catch {}

      console.log(`Successfully upscaled and updated look ${lookId}`);
      return NextResponse.json({ received: true, success: true });
    } 
    
    if (status === "ERROR" || status === "FAILED") {
      await updateLookInAvatar(spaceId, avatarId, lookId, {
        status: 'error',
        errorMessage: body?.error || 'Upscale failed'
      });

      try {
        eventBus.emit('look.updated', { 
          spaceId, 
          avatarId, 
          lookId, 
          status: 'error' 
        });
      } catch {}

      console.error(`Upscale failed for look ${lookId}:`, body.message);
      return NextResponse.json({ received: true, success: false });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing Freepik webhook:", error);
    return NextResponse.json(
      { error: `Error processing Freepik webhook: ${error.message}` },
      { status: 500 }
    );
  }
}


