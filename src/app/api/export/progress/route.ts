import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { getProgress } from '@/src/lib/render';
import { addCreditsToSpace } from '@/src/dao/spaceDao';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/export/progress by user: ", session.user.id);

  const params = await req.json();

  const { renderId, bucketName, spaceId, creditCost, firstAttempt } = params;

  try {

    const renderResult = await getProgress(renderId, bucketName);

    if (renderResult && renderResult.status === 'failed' && !firstAttempt) {
      await addCreditsToSpace(spaceId, creditCost);
    }

    return NextResponse.json({ data: renderResult })
  } catch (error) {
    console.error('Error creating export:', error)
    return NextResponse.json({ error: 'Error creating export' }, { status: 500 })
  }
}