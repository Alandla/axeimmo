import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { isUserInSpace } from '@/src/dao/userDao';
import { getSpaceById } from '@/src/dao/spaceDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/getMedias by user: ", session.user.id);

  const params = await req.json();

  const { spaceId } = params;

  try {

    const userIsInSpace: boolean = await isUserInSpace(session.user.id, spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const space = await getSpaceById(spaceId);

    return NextResponse.json({ data: space.medias.reverse() })
  } catch (error) {
    console.error('Error getting space medias:', error)
    return NextResponse.json({ error: 'Error getting space medias' }, { status: 500 })
  }
}