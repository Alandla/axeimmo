import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { IVideo } from '@/src/types/video';
import { getVideoById } from '@/src/dao/videoDao';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("GET /api/video/id by user: ", session.user.id);

    const userId = session.user.id;
    const video: IVideo | null = await getVideoById(params.id);

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ data: video });
  } catch (error) {
    console.error("fetchingVideoById", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
