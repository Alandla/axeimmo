import { auth } from '@/src/lib/auth';
import { NextRequest, NextResponse } from "next/server";
import { createTextToSpeech } from "@/src/lib/tts";
import { voicesConfig } from '@/src/config/voices.config';
import { calculateElevenLabsCost } from '@/src/lib/cost';
import { getSpaceById } from '@/src/dao/spaceDao';
import { ISpace } from '@/src/types/space';

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST /api/audio/generate by user: ", session.user.id);

    const params = await req.json();

    const { text, voiceId, spaceId, emotionEnhancement } = params;

    console.log("text: ", text);
    console.log("voiceId: ", voiceId);

    try {

        let voice = voicesConfig.find(voice => voice.id === voiceId);
        if (!voice) {
            const space : ISpace = await getSpaceById(spaceId);
            voice = space.voices.find(voice => voice.id === voiceId);
        }

        if (!voice) {
            return NextResponse.json({ error: "Voice not found" }, { status: 404 });
        }

        const audioResult = await createTextToSpeech(voice, text, true, undefined, undefined, emotionEnhancement || false);

        const data = {
            audioUrl: audioResult.audioUrl,
            cost: audioResult.cost,
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error generating audio', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}