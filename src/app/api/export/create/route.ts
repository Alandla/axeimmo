import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { createExport } from '@/src/dao/exportDao';
import { IExport } from '@/src/types/export';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/export/create by user: ", session.user.id);

  const params = await req.json();

  const { videoId, spaceId, creditCost } = params;

  try {

    const exportData: IExport = {
      videoId,
      spaceId,
      userId: session.user.id,
      status: 'pending',
      creditCost
    }

    const exportResult = await createExport(exportData);

    return NextResponse.json({ data: exportResult })
  } catch (error) {
    console.error('Error creating export:', error)
    return NextResponse.json({ error: 'Error creating export' }, { status: 500 })
  }
}