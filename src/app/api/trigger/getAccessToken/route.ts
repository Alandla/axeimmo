import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { auth as triggerAuth } from '@trigger.dev/sdk/v3';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/trigger/startExport by user: ", session.user.id);

  const params = await req.json();

  const { runId } = params;

  try {

    const publicToken = await triggerAuth.createPublicToken({
      scopes: {
        read: {
          runs: [runId],
        },
      },
    });

    return NextResponse.json({ data: { runId: runId, publicAccessToken: publicToken } })
  } catch (error) {
    console.error('Error starting generation:', error)
    return NextResponse.json({ error: 'Error starting generation' }, { status: 500 })
  }
}