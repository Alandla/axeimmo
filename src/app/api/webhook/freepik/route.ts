import { NextRequest, NextResponse } from "next/server";
import { updateLookInAvatar } from "@/src/dao/spaceDao";
import { uploadImageFromUrlToS3 } from "@/src/lib/r2";
import { eventBus } from "@/src/lib/events";
import connectMongo from "@/src/lib/mongoose";

export async function POST(req: NextRequest) {
  console.log("POST /api/webhook/freepik - Received upscale result");

  try {
    await connectMongo();

    const body = await req.json();
    console.log("Freepik webhook payload:", JSON.stringify(body, null, 2));

    const { searchParams } = new URL(req.url);
    const spaceId = searchParams.get('spaceId');
    const avatarId = searchParams.get('avatarId');
    const lookId = searchParams.get('lookId');
    
    if (!spaceId || !avatarId || !lookId) {
      console.error("Missing query parameters in webhook URL");
      return NextResponse.json({ error: "Missing query parameters" }, { status: 400 });
    }

    // Webhook payload is the same as GET response but WITHOUT the 'data' field
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

