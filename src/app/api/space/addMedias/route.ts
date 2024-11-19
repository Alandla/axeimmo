import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { tasks } from '@trigger.dev/sdk/v3';
import { addMediasToSpace } from '@/src/dao/spaceDao';
import { isUserInSpace } from '@/src/dao/userDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/addMedias by user: ", session.user.id);

  const params = await req.json();

  const { spaceId, medias } = params;

  try {

    const userIsInSpace: boolean = await isUserInSpace(session.user.id, spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await addMediasToSpace(spaceId, medias);

    return NextResponse.json({ data: "Medias added to space" })
  } catch (error) {
    console.error('Error starting generation:', error)
    return NextResponse.json({ error: 'Error starting generation' }, { status: 500 })
  }
}