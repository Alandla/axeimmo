import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { renderVideo } from '@/src/lib/render';
import { updateExport } from '@/src/dao/exportDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/export/start by user: ", session.user.id);

  const params = await req.json();

  const { video, exportId } = params;

  try {

    const renderResult = await renderVideo(video);

    console.log("Render result: ", renderResult)

    await updateExport(exportId, { renderId: renderResult.renderId, bucketName: renderResult.bucketName, status: 'processing' });

    const result = {
        renderId: renderResult.renderId,
        bucketName: renderResult.bucketName
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error creating export:', error)
    return NextResponse.json({ error: 'Error creating export' }, { status: 500 })
  }
}