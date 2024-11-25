import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { updateSubtitleStyleToSpace } from '@/src/dao/spaceDao';
import { isUserInSpace } from '@/src/dao/userDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/subtitleStyle/update by user: ", session.user.id);

  const params = await req.json();

  const { spaceId, subtitleStyleId, subtitleStyle } = params;

  try {

    const userIsInSpace: boolean = await isUserInSpace(session.user.id, spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedSubtitleStyle: any = await updateSubtitleStyleToSpace(spaceId, subtitleStyle, subtitleStyleId);

    return NextResponse.json({ data: updatedSubtitleStyle })
  } catch (error) {
    console.error('Error adding subtitle style:', error)
    return NextResponse.json({ error: 'Error adding subtitle style' }, { status: 500 })
  }
}