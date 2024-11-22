import { auth } from '@/src/lib/auth';
import { uploadImageFromUrlToS3 } from '@/src/lib/r2';
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
    const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/export/uploadImage by user: ", session.user.id);

  const params = await req.json();
  const { url } = params;

  try {

    const fileName = `image-${Date.now()}.jpg`;
    const s3Url = await uploadImageFromUrlToS3(url, "medias-user", fileName);

    return NextResponse.json({ url: s3Url });
  } catch (error) {
    console.error("Failed to upload media:", error);
    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
  }
}