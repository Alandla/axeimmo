import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { logger } from "@trigger.dev/sdk/v3";
import Groq from "groq-sdk";

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY
});

const client = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

interface ImageAnalysisResponse {
    description: string;
}

/**
 * Analyse une image et retourne une description détaillée
 * @param imageUrl L'URL de l'image à analyser
 * @returns La description de l'image
 */
export async function analyzeImage(imageUrl: string): Promise<ImageAnalysisResponse | null> {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const completion = await client.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `<instructions> You are a visual analysis assistant specializing in detailed image descriptions.
Analyze the input to provide a precise description capturing key elements, actions, subjects, and any notable transitions or movements shown.

Pay special attention to details within the image, focus on what looks most important in the photo

Your description should be as comprehensive as possible, identifying important visual elements and their relationships within the scene. </instructions>

Return a single JSON object enforcing the following schema:

{
  "type": "object",
  "properties": {
    "description": {
      "description": "A precise description of the image capturing key elements, actions, subjects, and notable details",
      "examples": [
        "The image shows a family of four having a picnic in a sunlit park. The parents are sitting on a red blanket while two children, approximately 5-7 years old, are playing with a yellow frisbee in the foreground. In the background, there are tall oak trees and a small pond with ducks swimming."
      ],
      "type": "string"
    }
  }
}`
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "What's in this image?"
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: imageUrl
                                }
                            }
                        ]
                    }
                ],
                model: "meta-llama/llama-4-maverick-17b-128e-instruct",
                temperature: 1,
                response_format: { type: "json_object" }
            });

            if (!completion.choices[0].message.content) {
                throw new Error("No response from Groq");
            }

            const response = JSON.parse(completion.choices[0].message.content);
            return response as ImageAnalysisResponse;

        } catch (error) {
            attempts++;
            logger.error(`Attempt ${attempts} failed to analyze image:`, {
                error: error instanceof Error ? error.message : String(error)
            });

            if (attempts === maxAttempts) {
                logger.error("Maximum attempts reached for image analysis. Returning null.");
                return null;
            }

            // Attendre avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    return null;
}

export const generateStartData = async (script: string) => {
    try {
        const result = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            messages: [
                {
                    role: "user",
                    content: "You are tasked with analyzing a video script and generating specific metadata about it. Your goal is to create a JSON output containing a title, style/genre/emotion, and a boolean indicating whether the video is about current news." +
                            "" +
                            "Here is the video script you need to analyze:" +
                            "" +
                            "<script>" +
                            script +
                            "</script>" +
                            "" +
                            "Carefully read and analyze the script, paying attention to its main theme, tone, and content." +
                            "" +
                            "To generate the title:" +
                            "" +
                            "- Create a short, catchy title that summarizes the main idea of the video" +
                            "- The title should be no more than 7 words long" +
                            "- Ensure it's engaging and relevant to the content" +
                            "- It must be in the same language as the script" +
                            "" +
                            "For the style/genre/emotion:" +
                            "- Choose one option from the following predefined list that best matches the overall tone and content of the video:" +
                            "* Informative" +
                            "* Entertaining" +
                            "* Inspirational" +
                            "* Dramatic" +
                            "* Humorous" +
                            "* Educational" +
                            "* Mysterious" +
                            "* Relaxing" +
                            "" +
                            "To determine if the video is about current news:" +
                            "- Set the \"news\" boolean to true if the content is primarily focused on recent events, breaking news, or current affairs" +
                            "- Set it to false if the content is evergreen, historical, or not tied to current events" +
                            "" +
                            "Generate your response in the following JSON format:" +
                            "" +
                            "{ " +
                            "\"title\": \"\", " +
                            "\"style\": \"\", " +
                            "\"news\": false " +
                            "}" +
                            "" +
                            "Before submitting your final answer, double-check that:" +
                            "" +
                            "1. The title is no more than 7 words" +
                            "2. The style is one of the predefined options" +
                            "3. The news boolean is correctly set" +
                            "4. The JSON format is correct and valid" +
                            "" +
                            "YOU MUST REPLY ONLY WITH JSON" +
                            "RESPECT THE RESPONSE STRUCTURE" +
                            "NEVER RESPOND EXPLANATION" +
                            "NO INTRODUCTION LIKE \"Here is the json...\""
                }
            ],
        });

        const jsonResponse = JSON.parse(result.text);

        const data = {
            details: jsonResponse,
            cost: 0
        }

        return data
    } catch (error) {
        console.error(error)
        return null
    }
}

export const summarizeCompany = async (searchResults: any) => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const completion = await client.chat.completions.create({
                model: "meta-llama/llama-4-scout-17b-16e-instruct",
                messages: [
                    {
                        role: "user", 
                        content: `You are an expert business analyst tasked with creating a detailed company summary based on web search results. This summary will be used to create optimized video scripts for social networks. Your goal is to analyze the provided company data and extract key information to create a comprehensive summary broken down into specific sections.

Here is the company data from web search results:

<company_data>
${JSON.stringify(searchResults)}
</company_data>

Please carefully analyze the provided company data, focusing on content from the company's website pages such as landing, FAQ, about, and pricing pages. Extract relevant information to create a detailed summary for each of the following sections:

1. Mission: Summarize what the company does and provide an overview of their main activities.
2. Audience: Identify who this brand could target on social networks to generate interest in their product and encourage purchases through educational content, problem-solving, sales pitches, etc.
3. Need: Explain why this company would benefit from using our automatic video creation software. Highlight how our software enables faster content creation (allowing for more content) and cost-effective production, which can help the company grow on social networks, run ads, etc.

For each section, wrap your analysis inside <detailed_analysis> tags. In your analysis:

For Mission:
- List key phrases from the company data that describe their activities and offerings
- Note any specific products or services mentioned
- Summarize the company's main focus and goals

For Audience:
- Create a persona for the target audience, including:
  * Demographics (age, location, profession, etc.)
  * Psychographics (interests, values, lifestyle, pain points)
- Explain how this persona aligns with the company's offerings

For Need:
- List specific challenges the company might face in content creation or marketing
- For each challenge, explain how video creation software addresses it
- Highlight the potential impact on the company's growth and social media presence

Then, refine your draft based on the following guidelines:

- Write as if you were the company founder explaining the concept.
- No "This company", "they" but "Our" or "my company".
- Use simple, clear language without unnecessary complexity.
- Be thorough but concise, avoiding long-winded explanations.
- Do not mention the company name in the summary.

After your analysis, generate three ideas for videos that would be suitable for the company's social media presence. These ideas should:
- Be engaging and capture the attention of the target audience
- Serve different purposes (e.g., educational content, problem resolution, product explanation)
- Be described briefly in one or two sentences
- For educational content and problem resolution, they don't necessarily showcase what the company is selling, they serve to educate the audience and help them solve their problems, and make them curious to find out more, so they can discover more about the company.
- No need to add the theme, don't add text like 'A tutorial video on', 'A problem solution video titled'.
- No need to specify video duration

Finally, present your summary and video ideas in JSON format. Use the following structure:

{
  "mission": "Concise description of what the company does and their main activities",
  "audience": "Clear analysis of the target audience for social media content",
  "need": "Straightforward explanation of why the company would benefit from our video creation software",
  "ideas": [
    "Brief description of educational content video idea",
    "Brief description of problem resolution video idea",
    "Brief description of product explanation video idea"
  ]
}

Ensure that each section provides an accurate and easy-to-understand representation of the company based on the available data.`
                    }
                ],
                temperature: 1,
                stream: false,
                response_format: { type: "json_object" }
            });

            if (!completion.choices[0].message.content) {
                throw new Error("No response from Groq");
            }

            const jsonResponse = JSON.parse(completion.choices[0].message.content || "");

            return jsonResponse;
        } catch (error: any) {
            attempts++;
            console.error(`Attempt ${attempts} failed:`, error);

            if (attempts === maxAttempts) {
                console.error("Maximum attempts reached. Returning null.");
                return null;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    return null;
}