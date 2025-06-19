import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { isUserInSpace } from '@/src/dao/userDao';
import { getTotalVideoCountBySpaceId } from '@/src/dao/videoDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/videoCount by user: ", session.user.id);

  const params = await req.json();

  const { spaceId } = params;

  try {
    const userIsInSpace: boolean = await isUserInSpace(session.user.id, spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalCount = await getTotalVideoCountBySpaceId(spaceId);

    return NextResponse.json({ data: { totalCount } })
  } catch (error) {
    console.error('Error getting video count:', error)
    return NextResponse.json({ error: 'Error getting video count' }, { status: 500 })
  }
}