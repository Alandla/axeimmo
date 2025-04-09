import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/src/lib/auth';
import { isUserInSpace } from '@/src/dao/userDao';
import { ISpace } from '@/src/types/space';
import { getSpaceById, updateSpace } from '@/src/dao/spaceDao';
import { SimpleSpace } from '@/src/types/space';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("GET /api/space/id/voices by user: ", session.user.id);

  try {
    const isAdmin = session.user.email === "alan@hoox.video" || session.user.email === "maxime@hoox.video";
    
    if (!isAdmin) {
      const userIsInSpace: boolean = await isUserInSpace(session.user.id, params.id);
      if (!userIsInSpace) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const space: ISpace = await getSpaceById(params.id)

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 });
    }

    return NextResponse.json({ data: space })
  } catch (error) {
    console.error('Error adding subtitle style:', error)
    return NextResponse.json({ error: 'Error adding subtitle style' }, { status: 500 })
  }
}

export async function POST( req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST /api/space/id by user: ", session.user.id);

    const spaceId = params.id;
    
    const userIsInSpace = await isUserInSpace(session.user.id, spaceId);
    if (!userIsInSpace) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const simpleSpaceData: Partial<SimpleSpace> = await req.json();
    
    const spaceUpdateData: Partial<ISpace> = {};
    
    if (simpleSpaceData.name !== undefined) {
      spaceUpdateData.name = simpleSpaceData.name;
    }
    
    if (simpleSpaceData.companyMission !== undefined || simpleSpaceData.companyTarget !== undefined) {
      
      spaceUpdateData.details = {
        ...(simpleSpaceData.companyMission !== undefined && { companyMission: simpleSpaceData.companyMission }),
        ...(simpleSpaceData.companyTarget !== undefined && { companyTarget: simpleSpaceData.companyTarget })
      };
    }
    
    const updatedSpace = await updateSpace(spaceId, spaceUpdateData);
    
    return NextResponse.json({ data: updatedSpace });
  } catch (error: any) {
    console.error("Error updating space:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update space" },
      { status: 500 }
    );
  }
}
