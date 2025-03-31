import { auth } from '@/src/lib/auth';
import { NextRequest, NextResponse } from "next/server";
import { createAudioTTS } from "@/src/lib/elevenlabs";
import { uploadToS3Audio } from "@/src/lib/r2";
import { voicesConfig } from '@/src/config/voices.config';
import { calculateElevenLabsCost } from '@/src/lib/cost';
import { createTranscription, getTranscription } from '@/src/lib/gladia';
import { getSpaceById } from '@/src/dao/spaceDao';
import { ISpace } from '@/src/types/space';

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST /api/audio/generate by user: ", session.user.id);

    const params = await req.json();

    const { text, voiceId, spaceId } = params;

    console.log("text: ", text);
    console.log("voiceId: ", voiceId);

    try {

        let voice = voicesConfig.find(voice => voice.id === voiceId);
        if (!voice) {
            const space : ISpace = await getSpaceById(spaceId);
            voice = space.voices.find(voice => voice.id === voiceId);
        }
        const audioBuffer = await createAudioTTS(voiceId, text, voice?.voiceSettings);

        const audioUrl = await uploadToS3Audio(audioBuffer, 'medias-users');

        const cost = calculateElevenLabsCost(text, false);

        const data = {
            audioUrl,
            cost,
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error generating audio', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}