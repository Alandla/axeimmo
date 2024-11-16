import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
import { calculateAnthropicCost } from "./cost";

const groq = createGroq({
    apiKey: process.env.GROQ_API_KEY
});

export const generateKeywords = async (sequences: any) => {
    try {
        const result = await generateText({
            model: groq('llama-3.1-70b-versatile'),
            prompt:
                "You are an experienced video editor tasked with generating keywords for illustrating sequences in a video script. These keywords will be used to search for stock footage or web images to match the content of each sequence. Your goal is to create descriptive, searchable keywords that will yield appropriate visual results." +
                "" +
                "Instructions:" +
                "" +
                "1. Read through the entire script to understand the context and overall theme." +
                "" +
                "2. For each sequence in the script, you will generate three keywords, each with a different level of precision:" +
                "- HARD: Ultra precise, matching exactly what should be displayed" +
                "- NORMAL: More global and straightforward for easy searching" +
                "- EASY: Very simple, to ensure a result while maintaining relevance" +
                "" +
                "3. Keep these important points in mind when generating keywords:" +
                "- Keywords must be in English and as short as possible" +
                "- Focus on describing what should be displayed visually, not necessarily using words from the text" +
                "- Be creative, thinking like a video editor" +
                "- Maintain the full context of the video when choosing keywords" +
                "- Prioritize keywords that would match stock video content (used 90% of the time)" +
                "- Does not include number" +
                "- Avoid overly specific phrases; instead, use general, descriptive terms" +

                "Example of good keywords:" +
                "- For \"A 17 ans, il quitte son pays pour le Canada, dormant chez\":" +
                "* HARD: \"plane taking off\"" +
                "* NORMAL: \"Airport departure\"" +
                "* EASY: \"Travel\"" +
                "" +
                "Example of keywords to avoid:" +
                "- \"Leaving home airport\" (too specific and not descriptive of the visual)" +
                "" +
                "4. For each keyword, determine the best search method:" +
                "- \"stock\" for generic, high-quality content (use this 90% of the time)" +
                "- \"web\" for proper names or trademarks" +
                "" +
                "5. Organize your results into a JSON array with " + sequences.length + "  entries, one for each sequence. Each entry should include:" +
                "- An \"id\" field with the sequence number" +
                "- A \"keywords\" array containing three objects, each with a \"keyword\" and \"search\" field" +
                "" +
                "YOU MUST REPLY ONLY WITH JSON" +
                "RESPECT THE RESPONSE STRUCTURE" +
                "NO INTRODUCTION LIKE \"Here is the json...\"" +

                "Your final output should be a valid JSON array, structured as follows:" +
                "" +
                "[" +
                " {" +
                "    \"id\": 1," +
                "    \"keywords\": [" +
                "        {" +
                "            \"keyword\": \"HARD keyword\"," +
                "            \"precision\": \"HARD\"," +
                "            \"search\": \"stock or web\"" +
                "        }," +
                "        {" +
                "            \"keyword\": \"NORMAL keyword\"," +
                "            \"precision\": \"NORMAL\"," +
                "            \"search\": \"stock or web\"" +
                "        }," +
                "        {" +
                "            \"keyword\": \"EASY keyword\"," +
                "            \"precision\": \"EASY\"," +
                "            \"search\": \"stock or web\"" +
                "        }" +
                "    ]" +
                "    }" +
                "    // ... (repeat for all " + sequences.length + " sequences)" +
                "]" +

                "Remember to focus on creating keywords that will yield appropriate stock video results for the majority of searches. Only use the \"web\" search method for specific proper names or trademarks that are unlikely to be found in a stock library." +

                "Here is the video script you'll be working with:" +

                JSON.stringify(sequences),
        });

        console.log("Result", result);

        const jsonResponse = JSON.parse(result.text);

        const data = {
            keywords: jsonResponse,
            cost: 0
        }

        return data
    } catch (error) {
        console.error(error)
        return null
    }
}