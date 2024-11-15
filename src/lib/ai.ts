import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { calculateAnthropicCost } from "./cost";

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY
});

export const generateStartData = async (script: string) => {
    try {
        const result = await generateText({
            model: groq('llama-3.1-70b-versatile'),
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

        console.log("Result", result);

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