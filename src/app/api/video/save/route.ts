import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { updateVideo } from '@/src/dao/videoDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/video/save by user: ", session.user.id);

  const params = await req.json();

  const { video } = params;

  try {

    await updateVideo(video);

    return NextResponse.json({ data: 'Video saved' })
  } catch (error) {
    console.error('Error saving video:', error)
    return NextResponse.json({ error: 'Error saving video' }, { status: 500 })
  }
}