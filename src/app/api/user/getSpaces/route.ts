import { NextRequest, NextResponse } from 'next/server';
import { getUserSpaces } from '@/src/dao/spaceDao';
import { auth } from '@/src/lib/auth';
import { SimpleSpace } from '@/src/types/space';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("GET /api/user/getSpaces by user: ", session.user.id);

    const userId = session.user.id;
    const spaces: SimpleSpace[] = await getUserSpaces(userId);

    console.log("spaces", spaces);

    return NextResponse.json({ data: spaces });
  } catch (error) {
    console.error("fetchingUserSpaces", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
