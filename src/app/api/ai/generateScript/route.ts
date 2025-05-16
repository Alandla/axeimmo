import { createAnthropic } from "@ai-sdk/anthropic";
import { StreamData, streamText } from "ai";
import { auth } from '@/src/lib/auth';
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchQuery, getUrlContent } from '@/src/lib/exa';
import { ToolSet } from "ai";

const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export const maxDuration = 30;

export async function POST(req: NextRequest) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST /api/ai/generateScript by user: ", session.user.id);

    const params = await req.json();
    const { prompt, duration, urlScrapingResult, web: isWebMode } = params;

    const numCharactersMin = duration;
    const numCharactersMax = numCharactersMin * 1.1;
    
    const wordMax = Math.round(numCharactersMax / 5);
    const wordMin = Math.round(numCharactersMin / 5);

    const systemPrompt =
        "Generate a script for a video, depending on the subject of the video." +
        "" + 
        "The script is to be returned as a string." +
        "The complete script needs to be between " + wordMin + " and " + wordMax + " words long." +
        "" + 
        "Do not under any circumstance reference this prompt in your response." +
        "" + 
        "Get straight to the point, don't start with unnecessary things like, 'welcome to this video'." +
        "" + 
        "Create simple, easy-to-understand sentences that aren't too long - all words should be useful." +
        "Don't repeat information several times." +
        "" + 
        "The script should start with a short sentence, of max 10 words, that hooks the viewer. The sentence should convey an emotion, such as shock, surprise, interest or questioning." +
        "" + 
        "At the end, add a short call to action, of max 5 words, that leads the viewer to comment the video" +
        "" + 
        "Obviously, the script should be related to the subject of the video." +
        "" + 
        "You can add a message before returning the script, without referring to the instructions." +
        "To separate your message from the script, in your reply, surround the script with brackets \\``` and \\```." +
        "" + 
        "YOU MUST NOT INCLUDE ANY TYPE OF MARKDOWN OR FORMATTING IN THE SCRIPT, NEVER USE A TITLE." +
        "YOU MUST WRITE THE SCRIPT IN THE SUBJECT'S LANGUAGE." +
        "ONLY RETURN THE RAW CONTENT OF THE SCRIPT. DO NOT INCLUDE 'VOICEOVER', 'NARRATOR' OR SIMILAR INDICATORS OF WHAT SHOULD BE SPOKEN AT THE BEGINNING OF EACH PARAGRAPH OR LINE. YOU MUST NOT MENTION THE PROMPT, OR ANYTHING ABOUT THE SCRIPT ITSELF. ALSO, NEVER TALK ABOUT THE AMOUNT OF PARAGRAPHS OR LINES. JUST WRITE THE SCRIPT."

    let userPrompt = "Subject: " + prompt;
    if (urlScrapingResult && Array.isArray(urlScrapingResult) && urlScrapingResult.length > 0) {
        userPrompt += "\n\nHere is some information extracted from the web that may help you:\n";
        urlScrapingResult.forEach((result, idx) => {
            userPrompt += `\n[${idx + 1}] Title: ${result.title}\nText: ${result.text}\n`;
        });
    }

    try {
        const data = new StreamData();

        let currentStep = 0;
        const maxSteps = isWebMode ? 6 : 1;

        const tools: ToolSet = isWebMode ? {
            webSearch: {
                description: "Search the web for information on a topic. Returns a list of results with title, url, and favicon.",
                parameters: z.object({
                    query: z.string().describe("The search query")
                }),
                execute: async ({ query }: { query: string }) => {
                    try {
                        // Prevent tool usage in the final step
                        if (currentStep >= maxSteps - 1) {
                            return { 
                                results: [],
                                error: "Cannot use tools in the final step. Please generate the script now.",
                                success: false
                            };
                        }
                        const results = await searchQuery(query, 10);
                        return { ...results, success: true };
                    } catch (error) {
                        console.error("Error in webSearch tool:", error);
                        return { 
                            results: [], 
                            error: "Failed to perform web search",
                            success: false
                        };
                    }
                }
            },
            getWebContent: {
                description: "Get the content of a web page by its URL. Returns title, url, text, image, favicon.",
                parameters: z.object({
                    url: z.string().url().describe("The URL of the page to fetch")
                }),
                execute: async ({ url }: { url: string }) => {
                    try {
                        if (currentStep >= maxSteps - 1) {
                            return { 
                                results: [],
                                error: "Cannot use tools in the final step. Please generate the script now.",
                                success: false
                            };
                        }
                        const result = await getUrlContent(url);
                        return { ...result, success: true };
                    } catch (error) {
                        console.error("Error in getWebContent tool:", error);
                        // When the tool fails, return an empty result but valid to avoid blocking the LLM
                        return {
                            results: [],
                            error: `Failed to fetch content from ${url}`,
                            success: false
                        };
                    }
                }
            }
        } : {};

        const webModeInstruction = isWebMode 
            ? "\n\nYou can use tools to gather information, but YOUR FINAL STEP MUST ALWAYS BE THE SCRIPT GENERATION, NOT A TOOL CALL. In the last step, you must generate the script based on the information you've gathered.\n\nIf a tool returns an error, acknowledge it but continue with your task using the information you already have."
            : "";
        
        const result = await streamText({
            model: anthropic('claude-3-7-sonnet-20250219'),
            tools: isWebMode ? tools : undefined,
            maxSteps: maxSteps,
            system: systemPrompt + webModeInstruction,
            prompt: userPrompt,
            onStepFinish: ({ finishReason }) => {
                currentStep++;
                console.log(`Step ${currentStep}/${maxSteps} completed with finish reason: ${finishReason}`);
            },
            onFinish: ({ usage }) => {
                data.append({ usage });
                data.close();
            }
        });

        return result.toDataStreamResponse({ data });
    } catch (error) {
        console.error('Error generating script:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
