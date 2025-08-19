import { auth } from '@/src/lib/auth';
import { NextRequest, NextResponse } from "next/server";
import { generateScriptStream } from '@/src/lib/ai-script-generation';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST /api/ai/generateScript by user: ", session.user.id);

    const params = await req.json();
    const { prompt, duration, urlScrapingResult, web: isWebMode } = params;

    try {
        return await generateScriptStream({
            prompt,
            duration,
            urlScrapingResult,
            webSearch: isWebMode
        });
    } catch (error) {
        console.error('Error generating script:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
