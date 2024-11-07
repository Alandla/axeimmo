import { createAnthropic } from "@ai-sdk/anthropic";
import { StreamData, streamText } from "ai";
import { auth } from '@/src/lib/auth';
import { NextRequest, NextResponse } from "next/server";

const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST /api/ai/improveScript by user: ", session.user.id);

    const params = await req.json();

    const { prompt, messagesList } = params;

    const messages = messagesList.map((message: any) => ({
        role: message.sender === 'ai' ? 'assistant' : 'user',
        content: message.prompt
    }));

    messages.push({
        role: 'user',
        content: prompt + "\n\nTo separate your message from the script, in your reply, surround the script with brackets \\``` and \\```."
    });

    console.log("messages: ", messages);

    try {
        const data = new StreamData();
        
        const result = await streamText({
          model: anthropic('claude-3-5-sonnet-20241022'),
          onFinish: ({ usage }) => {
              data.append({ usage });
              data.close();
          },
          messages
        })

        return result.toDataStreamResponse({ data });
    } catch (error) {
        console.error('Error generating script', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}