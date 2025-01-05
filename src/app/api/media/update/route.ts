import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { isUserInSpace } from '@/src/dao/userDao'
import { getSpaceByMediaId, updateMedia } from '@/src/dao/spaceDao'

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/media/update by user: ", session.user.id);

  const params = await req.json();
  const { mediaId, updates } = params;

  try {
    const space = await getSpaceByMediaId(mediaId);

    if (!space) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    const userIsInSpace = await isUserInSpace(session.user.id, space.id);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedMedia = await updateMedia(mediaId, updates);

    return NextResponse.json({ data: updatedMedia });
  } catch (error) {
    console.error('Error updating media:', error);
    return NextResponse.json({ error: 'Error updating media' }, { status: 500 });
  }
} 