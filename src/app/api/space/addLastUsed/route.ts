import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { updateSpaceLastUsed } from '@/src/dao/spaceDao';
import { isUserInSpace } from '@/src/dao/userDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/addLastUsed by user: ", session.user.id);

  const params = await req.json();

  const { spaceId, voiceId, avatarId, subtitleId } = params;

  try {

    const userIsInSpace: boolean = await isUserInSpace(session.user.id, spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await updateSpaceLastUsed(spaceId, voiceId, avatarId, subtitleId);

    return NextResponse.json({ data: response })
  } catch (error) {
    console.error('Error adding medias:', error)
    return NextResponse.json({ error: 'Error adding medias' }, { status: 500 })
  }
}