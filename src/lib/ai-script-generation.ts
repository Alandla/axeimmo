import { createAnthropic } from "@ai-sdk/anthropic";
import { StreamData, streamText, generateText } from "ai";
import { z } from "zod";
import { searchQuery, getUrlContent } from '@/src/lib/exa';
import { ToolSet } from "ai";
import { FirecrawlScrapedResult } from '@/src/lib/firecrawl';

const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export interface ScriptGenerationOptions {
  prompt: string;
  duration: number; // Duration in seconds
  urlScrapingResult?: FirecrawlScrapedResult[] | null;
  webSearch?: boolean;
}

export interface ScriptGenerationResult {
  script: string;
  cost: number;
  usage?: any;
}

interface BaseGenerationConfig {
  systemPrompt: string;
  userPrompt: string;
  tools: ToolSet;
  maxSteps: number;
}

/**
 * Convertit une durée en secondes vers le nombre de caractères estimé
 * Basé sur la formule : 936 caractères = 60 secondes (1 minute)
 */
function convertSecondsToCharacters(seconds: number): number {
    return Math.round((seconds / 60) * 936);
}

/**
 * Prépare la configuration commune pour la génération
 */
function prepareGenerationConfig(options: ScriptGenerationOptions): BaseGenerationConfig {
    const { prompt, duration, urlScrapingResult, webSearch: isWebMode = false } = options;

    // Convertir la durée en secondes vers le nombre de caractères
    const numCharactersMin = convertSecondsToCharacters(duration);
    const numCharactersMax = numCharactersMin * 1.1;
    
    const wordMax = Math.round(numCharactersMax / 5);
    const wordMin = Math.round(numCharactersMin / 5);

    const systemPrompt = buildSystemPrompt(wordMin, wordMax, isWebMode);
    const userPrompt = buildUserPrompt(prompt, urlScrapingResult);

    let currentStep = 0;
    const maxSteps = isWebMode ? 11 : 1;
    let searchCount = 0;
    let contentFetchCount = 0;
    const maxSearches = 2;
    const maxContentFetches = 4;

    const tools: ToolSet = isWebMode ? buildWebSearchTools(
        currentStep, 
        maxSteps, 
        searchCount, 
        contentFetchCount, 
        maxSearches, 
        maxContentFetches
    ) : {};

    return {
        systemPrompt,
        userPrompt,
        tools,
        maxSteps
    };
}

/**
 * Version streaming pour l'API privée (client-side)
 */
export async function generateScriptStream(options: ScriptGenerationOptions) {
    const { systemPrompt, userPrompt, tools, maxSteps } = prepareGenerationConfig(options);
    const isWebMode = options.webSearch;

    const data = new StreamData();
    let currentStep = 0;

    const result = await streamText({
        model: anthropic('claude-3-7-sonnet-20250219'),
        tools: isWebMode ? tools : undefined,
        maxSteps: maxSteps,
        system: systemPrompt,
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
}

/**
 * Version non-streaming pour l'API publique (server-side)
 */
export async function generateScriptDirect(options: ScriptGenerationOptions): Promise<ScriptGenerationResult> {
    const { systemPrompt, userPrompt, tools, maxSteps } = prepareGenerationConfig(options);
    const isWebMode = options.webSearch;

    let currentStep = 0;

    const result = await generateText({
        model: anthropic('claude-3-7-sonnet-20250219'),
        tools: isWebMode ? tools : undefined,
        maxSteps: maxSteps,
        system: systemPrompt,
        prompt: userPrompt,
        onStepFinish: ({ finishReason }) => {
            currentStep++;
            console.log(`Step ${currentStep}/${maxSteps} completed with finish reason: ${finishReason}`);
        }
    });

    // Extraire le script du texte complet
    const script = extractScriptFromText(result.text);

    return {
        script,
        cost: 0, // À calculer si nécessaire
        usage: result.usage
    };
}

/**
 * Construit le prompt système
 */
function buildSystemPrompt(wordMin: number, wordMax: number, isWebMode: boolean): string {
    const basePrompt = 
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
        "ONLY RETURN THE RAW CONTENT OF THE SCRIPT. DO NOT INCLUDE 'VOICEOVER', 'NARRATOR' OR SIMILAR INDICATORS OF WHAT SHOULD BE SPOKEN AT THE BEGINNING OF EACH PARAGRAPH OR LINE. YOU MUST NOT MENTION THE PROMPT, OR ANYTHING ABOUT THE SCRIPT ITSELF. ALSO, NEVER TALK ABOUT THE AMOUNT OF PARAGRAPHS OR LINES. JUST WRITE THE SCRIPT.";

    const webModeInstruction = isWebMode 
        ? "\n\nYou can use tools to gather information with these limits:\n- Maximum 2 web searches\n- Maximum 4 web content fetches\n\nYOUR FINAL STEP MUST ALWAYS BE THE SCRIPT GENERATION, NOT A TOOL CALL. You must generate the script based on the information you've gathered.\n\nIf a tool returns an error or you've reached the usage limit, continue with your task using the information you already have and generate the script."
        : "";

    return basePrompt + webModeInstruction;
}

/**
 * Construit le prompt utilisateur
 */
function buildUserPrompt(prompt: string, urlScrapingResult?: FirecrawlScrapedResult[] | null): string {
    let userPrompt = "Subject: " + prompt;
    
    if (urlScrapingResult && Array.isArray(urlScrapingResult) && urlScrapingResult.length > 0) {
        userPrompt += "\n\nHere is some information extracted from URL scraping, use this precise data to write the script without inventing values:\n";
        urlScrapingResult.forEach((result, idx) => {
            userPrompt += `\n[${idx + 1}] Title: ${result.title}\nText: ${result.markdown}\n`;
        });
    }

    return userPrompt;
}

/**
 * Construit les outils de recherche web
 */
function buildWebSearchTools(
    currentStep: number,
    maxSteps: number,
    searchCount: number,
    contentFetchCount: number,
    maxSearches: number,
    maxContentFetches: number
): ToolSet {
    return {
        webSearch: {
            description: "Search the web for information on a topic. Returns a list of results with title, url, and favicon.",
            parameters: z.object({
                query: z.string().describe("The search query")
            }),
            execute: async ({ query }: { query: string }) => {
                try {
                    // Prevent tool usage in the final step or if max searches reached
                    if (currentStep >= maxSteps - 1 || searchCount >= maxSearches) {
                        return { 
                            results: [],
                            error: "You've reached the maximum number of searches or are in the final step. Please generate the script now.",
                            success: false
                        };
                    }
                    searchCount++;
                    console.log(`Web search ${searchCount}/${maxSearches}`);
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
                    if (currentStep >= maxSteps - 1 || contentFetchCount >= maxContentFetches) {
                        return { 
                            results: [],
                            error: "You've reached the maximum number of content fetches or are in the final step. Please generate the script now.",
                            success: false
                        };
                    }
                    contentFetchCount++;
                    console.log(`Content fetch ${contentFetchCount}/${maxContentFetches}`);
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
    };
}

/**
 * Extrait le script du texte généré
 */
function extractScriptFromText(text: string): string {
    const scriptStartIndex = text.indexOf('```');
    if (scriptStartIndex !== -1) {
        let script = text.slice(scriptStartIndex + 3);
        const scriptEndIndex = script.lastIndexOf('```');
        if (scriptEndIndex !== -1) {
            script = script.slice(0, scriptEndIndex);
        }
        return script.trim();
    }
    return text.trim();
}