import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth';
import { tasks } from '@trigger.dev/sdk/v3';
import { calculateRequiredMachine } from '@/src/lib/video-estimation';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/trigger/startGeneration by user: ", session.user.id);

  const params = await req.json();

  const { options } = params;

  try {
    // Calculate machine needed based on video sizes
    const videoFiles = (options.files || []).filter((f: any) => f.type === 'video');
    const machinePreset = calculateRequiredMachine(videoFiles);
    
    console.log(`[MACHINE] Using machine preset: ${machinePreset} for ${videoFiles.length} video(s)`);

    const handle = await tasks.trigger("generate-video", options, {
      tags: [`user:${session.user.id}`],
      machine: machinePreset
    })

    return NextResponse.json({ data: { runId: handle.id, publicAccessToken: handle.publicAccessToken } })
  } catch (error) {
    console.error('Error starting generation:', error)
    return NextResponse.json({ error: 'Error starting generation' }, { status: 500 })
  }
}