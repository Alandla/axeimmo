import { NextRequest, NextResponse } from "next/server";
import { updateLookInAvatar } from "@/src/dao/spaceDao";
import { uploadImageFromUrlToS3 } from "@/src/lib/r2";
import connectMongo from "@/src/lib/mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: { spaceId: string; avatarId: string; lookId: string } }
) {
  try {
    await connectMongo();

    const body = await req.json();
    const { spaceId, avatarId, lookId } = params;
    
    if (!spaceId || !avatarId || !lookId) {
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

      return NextResponse.json({ received: true, success: true });
    } 
    
    if (status === "ERROR" || status === "FAILED") {
      await updateLookInAvatar(spaceId, avatarId, lookId, {
        status: 'error',
        errorMessage: body?.error || body?.message || 'Upscale failed',
        errorAt: new Date()
      });

      console.error('Upscale failed:', body?.error || body?.message);
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


