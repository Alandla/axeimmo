import { auth } from '@/src/lib/auth';
import { getTranscription } from '@/src/lib/transcription';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("POST /api/audio/getTranscription by user: ", session.user.id);

  const params = await req.json();
  const { audioUrl } = params;

  if (!audioUrl) {
    return Response.json(
      { error: 'audioUrl is required' },
      { status: 400 }
    );
  }

  try {
    const transcriptionResult = await getTranscription(audioUrl);

    if (!transcriptionResult) {
      return Response.json(
        { error: 'Failed to get transcription' },
        { status: 500 }
      );
    }

    const words = transcriptionResult.raw.words;

    const transcription = {
      text: transcriptionResult.text,
      language: transcriptionResult.raw.language,
      start: words.length > 0 ? words[0].start : 0,
      end: words.length > 0 ? words[words.length - 1].end : 0,
      words: words
    }

    return Response.json({ data: transcription });
  } catch (error: any) {
    console.error('Error in transcription:', error);
    return Response.json(
      { 
        error: error.message || 'Failed to get transcription status',
        details: error.response?.data 
      },
      { status: error.response?.status || 500 }
    );
  }
}