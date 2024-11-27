import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { updateUser } from '@/src/dao/userDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/user/update by user: ", session.user.id);

  const params = await req.json();

  const { updateData } = params;

  console.log(updateData);

  try {
    const userId = session.user.id;
    const user = await updateUser(userId, updateData);

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("fetchingUserSpaces", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
