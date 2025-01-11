import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { isUserInSpace } from '@/src/dao/userDao';
import { getSpaceVoices } from '@/src/dao/spaceDao';
import { Voice } from '@/src/types/voice';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("GET /api/space/id/voices by user: ", session.user.id);

  try {

    const userIsInSpace: boolean = await isUserInSpace(session.user.id, params.id);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voices: Voice[] = await getSpaceVoices(params.id)

    return NextResponse.json({ data: voices })
  } catch (error) {
    console.error('Error adding subtitle style:', error)
    return NextResponse.json({ error: 'Error adding subtitle style' }, { status: 500 })
  }
}
