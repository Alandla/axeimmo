import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { isUserInSpace } from '@/src/dao/userDao';
import { deleteVideo } from '@/src/dao/videoDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/video/delete by user: ", session.user.id);

  const params = await req.json();

  const { video } = params;

  try {

    const userIsInSpace: boolean = await isUserInSpace(session.user.id, video.spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteVideo(video.id);

    return NextResponse.json({ data: "Video deleted" })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json({ error: 'Error deleting video' }, { status: 500 })
  }
}