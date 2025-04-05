import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { isUserInSpace } from '@/src/dao/userDao'
import { updateSpaceDetails } from '@/src/dao/spaceDao'

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/details by user: ", session.user.id);

  const params = await req.json();
  const { spaceId, details } = params;

  if (!spaceId || !details) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
  }

  try {
    const userIsInSpace = await isUserInSpace(session.user.id, spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedDetails = await updateSpaceDetails(spaceId, details);

    return NextResponse.json({ data: updatedDetails });
  } catch (error) {
    console.error('Error updating space details:', error);
    return NextResponse.json({ error: 'Error updating space details' }, { status: 500 });
  }
} 