import { auth } from '@/src/lib/auth';
import { getTranscription } from '@/src/lib/gladia';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/audio/getTranscription by user: ", session.user.id);

  const params = await req.json();
  const { transcriptionId } = params;

  if (!transcriptionId) {
    return Response.json(
      { error: 'transcriptionId is required' },
      { status: 400 }
    );
  }

  try {
    const transcriptionStatus = await getTranscription(transcriptionId);

    return Response.json({ data: transcriptionStatus });
  } catch (error: any) {
    console.error('Error in transcription status:', error);
    return Response.json(
      { 
        error: error.message || 'Failed to get transcription status',
        details: error.response?.data 
      },
      { status: error.response?.status || 500 }
    );
  }
}