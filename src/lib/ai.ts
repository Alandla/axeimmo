import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { SimpleMedia, SimpleSequence } from "./analyse";
import { LightTranscription } from "./transcription";
import { logger } from "@trigger.dev/sdk/v3";
import Groq from "groq-sdk";

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY
});

const client = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const generateBrollDisplay = async (sequences: SimpleSequence[]) => {
    try {
        const result = await generateText({
            model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
            messages: [
                {
                    role: "user",
                    content: "You are an AI tasked with determining the optimal display mode for video sequences in a social media-oriented video generation system. Your goal is to analyze the relationship between the spoken text and the visual content for each sequence, and decide how prominently the visual content (b-roll) should be displayed." +
                            "You will be given a list of video sequences in the following format:" +
                            "" +
                            "<video_sequences>"+
                            JSON.stringify(sequences) +
                            "</video_sequences>"+
                            "" +
                            "For each sequence, consider the following criteria to determine the importance of the visual content:" +
                            "" +
                            "1. Relevance: How closely does the visual content relate to the spoken text?" +
                            "2. Informativeness: Does the visual content provide additional information not present in the text?" +
                            "3. Emotional impact: Does the visual content evoke emotions that enhance the message?" +
                            "4. Novelty: Is the visual content unique or unexpected given the context?" +
                            "5. Narrative support: Does the visual content help tell or reinforce the story?" +
                            "" +
                            "Based on these criteria, you will assign one of three display modes to each sequence:" +
                            "" +
                            "- \"full\": The b-roll should be displayed prominently, taking up the entire screen." +
                            "- \"half\": The b-roll should be displayed partially, with the avatar visible above it." +
                            "- \"hide\": The b-roll should not be displayed, showing only the avatar." +
                            "" +
                            "The same display mode should never be used more than 2 times in a row." +
                            "" +
                            "For each sequence, follow these steps:" +
                            "" +
                            "1. Read the spoken text and media description carefully." +
                            "2. Evaluate the importance of the visual content based on the criteria above." +
                            "3. Determine the most appropriate display mode." +
                            "4. Provide a brief justification for your decision." +
                            "5. Output the sequence ID and the chosen display mode." +
                            "" +
                            "Here are two examples of how to process a sequence:" +
                            "" +
                            "Example 1:" +
                            "Text: Un enfant harcelé devient l'homme le plus riche du monde." +
                            "Media Description: A young boy is sitting on the floor of a library, with his arms wrapped around his legs. He is looking down at the floor and appears to be sad or upset. There are bookshelves behind him, and the shelves are full of books. The lighting is dim and the overall mood is somber." +
                            "" +
                            "Reasoning: The visual content is highly relevant to the text, showing a child who appears to be bullied or upset. It provides strong emotional impact and supports the narrative of someone who faced challenges early in life. The library setting also hints at a focus on learning and knowledge." +
                            "" +
                            "Output:" +
                            "{"+
                            "  id: 1,"+
                            "  show: \"full\""+
                            "}"+
                            "" +
                            "Example 2:" +
                            "Text: Né en Afrique du Sud, le jeune Elon était différent" +
                            "Media Description: The video shows a view from a vehicle driving through a savanna. The camera is pointed towards the right side of the vehicle and we see a brown dirt road, dry grass, and bushes, with a few trees in the background. The sky is blue with a few white clouds." +
                            "" +
                            "Reasoning: While the visual content shows a scene from Africa, which is relevant to Elon Musk's birthplace, it doesn't directly relate to him being \"different\" or provide significant additional information about his character. The scene is somewhat generic and doesn't strongly support the narrative." +
                            "" +
                            "Output:" +
                            "{"+
                            "  id: 2,"+
                            "  show: \"half\""+
                            "}"+
                            "" +
                            "After processing all sequences, provide your final output as a JSON array containing objects with \"id\" and \"show\" properties for each sequence, like this:" +
                            "" +
                            "<output>" +
                            "[" +
                            "  {" +
                            "    id: 1,"+
                            "    show: \"full\""+
                            "  },"+
                            "  {" +
                            "    id: 2,"+
                            "    show: \"half\""+
                            "  },"+
                            "  ..."+
                            "]"+
                            "</output>"+
                            "" +
                            "Ensure that your output contains only the JSON array with no additional text or explanations." +
                            "YOU MUST REPLY ONLY WITH JSON" +
                            "RESPECT THE RESPONSE STRUCTURE" +
                            "NEVER RESPOND EXPLANATION" +
                            "NO INTRODUCTION LIKE \"Here is the json...\""
                }
            ],
        });

        console.log("Result", result);

        const jsonResponse = JSON.parse(result.text);

        const data = {
            show: jsonResponse,
            cost: 0
        }

        return data
    } catch (error) {
        console.error(error)
        return null
    }
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

        logger.info("Result", { text: result?.text });

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

export const matchMediaToSequences = async (sequences: LightTranscription[], media: SimpleMedia[]) => {
    try {
        const result = await generateText({
            model: groq('llama-3.3-70b-versatile'),
            messages: [
                {
                    role: "user",
                    content: "You are an AI assistant tasked with matching media descriptions to video sequences based on their content. Your goal is to create a JSON output that links each media item to the most appropriate sequence(s)." +
                            "" +
                            "Instructions:" +
                            "1. Carefully read through the sequences and media descriptions." +
                            "2. For each media description, find the most appropriate matching sequence based on the following rules:" +
                            "  a. Every media description must be used exactly once." +
                            "  b. Not all sequences need to have a media item assigned to them." +
                            "  c. Match the media descriptions to sequences where the visual content best complements the voice-over text." +
                            "3. Create a JSON array output where each element contains:" +
                            "  a. The sequence ID (sequenceId)" +
                            "  b. The media ID (mediaId)" +
                            "  c. The index of the description used (description_index, 0-based)" +
                            "" +
                            "Important constraints:" +
                            "- Each pair of mediaId and description_index should only occur once in the output." +
                            "- The description_index should always be 0-based (0 for the first description, 1 for the second, etc.)." +
                            "- Each sequenceId should only appear once in the output." +
                            "" +
                            "Here's an example of how the input and output might look:" +
                            "" +
                            "Input example:" +
                            "" +
                            "<sequences>" +
                            "[" +
                            "  {" +
                            "    id: 0," +
                            "    text: Welcome to our beautiful city" +
                            "  }," +
                            "  {" +
                            "    id: 1," +
                            "    text: Our parks offer a peaceful retreat" +
                            "  }," +
                            "  {" +
                            "    id: 2," +
                            "    text: Our restaurants are fabulous, with an enormous range of dishes." +
                            "  }," +
                            "  {" +
                            "    id: 3," +
                            "    text: The skyline is breathtaking at night" +
                            "  }" +
                            "]" +
                            "</sequences>" +
                            "" +
                            "<media>" +
                            "[" +
                            "  {" +
                            "    id: 0," +
                            "    descriptions: [\"A panoramic view of a city\"]" +
                            "  }," +
                            "  {" +
                            "    id: 1," +
                            "    descriptions: [\"Tall buildings lit up against a night sky\",\"People walking in a green park with trees\"]" +
                            "  }" +
                            "]" +
                            "</media>" +
                            "" +
                            "Output example:" +
                            "" +
                            "[" +
                            "  {" +
                            "    sequenceId: 0," +
                            "    mediaId: 0," +
                            "    description_index: 0" +
                            "  }," +
                            "  {" +
                            "    sequenceId: 1," +
                            "    mediaId: 1," +
                            "    description_index: 1" +
                            "  }," +
                            "  {" +
                            "    sequenceId: 3," +
                            "    mediaId: 1," +
                            "    description_index: 0" +
                            "  }" +
                            "]" +
                            "" +
                            "YOU MUST REPLY ONLY WITH JSON" +
                            "RESPECT THE RESPONSE STRUCTURE" +
                            "NEVER RESPOND EXPLANATION" +
                            "NO INTRODUCTION LIKE \"Here is the json...\"" +
                            "PUTS THE RAW JSON WITH NOTHING AROUND IT" +
                            "" +
                            "Here are the input variables you will work with:" +
                            "" +
                            "<sequences>" +
                            JSON.stringify(sequences) +
                            "</sequences>" +
                            "" +
                            "<media>" +
                            JSON.stringify(media) +
                            "</media>"
                }
            ],
        });

        console.log("Result", result);

        const jsonResponse = JSON.parse(result.text);

        const data = {
            assignments: jsonResponse,
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
- No “This company”, “they” but “Our” or “my company”.
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