import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { addSubtitleStyleToSpace, getSpaceById } from '@/src/dao/spaceDao';
import { isUserInSpace } from '@/src/dao/userDao';
import { PlanName } from '@/src/types/enums';
import { ISpace } from '@/src/types/space';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/space/addSubtitleStyle by user: ", session.user.id);

  const params = await req.json();

  const { spaceId, subtitleStyle } = params;

  try {

    const userIsInSpace: boolean = await isUserInSpace(session.user.id, spaceId);

    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const space: ISpace = await getSpaceById(spaceId);
    if (space.plan.name !== PlanName.PRO && space.plan.name !== PlanName.ENTREPRISE) {
      return NextResponse.json({ error: "premium-required" }, { status: 403 });
    }

    const addedSubtitleStyle: any = await addSubtitleStyleToSpace(spaceId, subtitleStyle);

    return NextResponse.json({ data: addedSubtitleStyle })
  } catch (error) {
    console.error('Error adding subtitle style:', error)
    return NextResponse.json({ error: 'Error adding subtitle style' }, { status: 500 })
  }
}