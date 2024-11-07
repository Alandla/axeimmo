import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { getPresignedUrl } from '@/src/lib/r2';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/media/getPresignedUrl by user: ", session.user.id);

  const params = await req.json();

  const { filename, bucket } = params;

  try {

    const mediaId = uuidv4();

    const { url, key } = await getPresignedUrl(filename, mediaId, bucket)

    const data = { url, key }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error generating presigned URL:', error)
    return NextResponse.json({ error: 'Error generating presigned URL' }, { status: 500 })
  }
}