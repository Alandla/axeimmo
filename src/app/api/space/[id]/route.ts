import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { IVideo } from '@/src/types/video';
import { getVideoById } from '@/src/dao/videoDao';
import { isUserInSpace } from '@/src/dao/userDao';
import { ISpace } from '@/src/types/space';
import { getSpaceById } from '@/src/dao/spaceDao';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("GET /api/space/id by user: ", session.user.id);

  try {

    const userIsInSpace: boolean = await isUserInSpace(session.user.id, params.id);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const space: ISpace = await getSpaceById(params.id)

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    return NextResponse.json({ data: space })
  } catch (error) {
    console.error('Error adding subtitle style:', error)
    return NextResponse.json({ error: 'Error adding subtitle style' }, { status: 500 })
  }
}
