import { NextRequest, NextResponse } from 'next/server';
import { getUserSpaces } from '@/src/dao/spaceDao';
import { auth } from '@/src/lib/auth';
import { SimpleSpace } from '@/src/types/space';
import { getUserById } from '@/src/dao/userDao';
import { IUser } from '@/src/types/user';

export async function POST(req: NextRequest) {
  
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("GET /api/user/getByIdForVideo by user: ", session.user.id);

  const params = await req.json();

  const { userId } = params;

  try {
    const user: IUser = await getUserById(userId);

    const response = {
      id: user.id,
      name: user.name,
      image: user.image,
    }

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error("fetchingUserSpaces", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
