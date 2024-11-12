import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import axios from "axios"
import { calculateAnthropicCost } from "./cost";

const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export const generateKeywords = async (sequences: any) => {
    try {
        const result = await generateText({
            model: anthropic('claude-3-5-haiku-20241022'),
            temperature: 0.4,
            prompt:
                "I'm going to give you a video script divided into sequences." +
                "" +
                "Your role is to find keywords for each sequence that will let me illustrate the sequences with corresponding media." +
                "" +
                "Each sequence has 3 keywords, with different levels of precision:" +
                "- HARD: Ultra precise, matches exactly with what should be displayed" +
                "- NORMAL: More global and straightforward for easy searching." +
                "- EASY: Very simple, to make sure you get a result while keeping the link." +
                "" +
                "Keywords must be in english." +
                "You need to keep the full context of the video when choosing keywords." +
                "" +
                "I have 2 ways of searching for media:" +
                "- A stock video library: more generic, high-quality content, used 90% the time." +
                "- Web search: Only use for proper names or trademarks." +
                "" +
                "You have to answer me with a JSON, with 25 entries." +
                "Each entry is made up of 3 keywords, and each keyword must have a search method that best matches \"stock\" or \"web\"." +
                "Each entry must have the id of the corresponding sequence." +

                "Answer example:" +
                "[" +
                "    {" +
                "        \"id\": 1," +
                "        \"keywords\": [" +
                "            {" +
                "                \"keyword\": \"bullied child crying\"," +
                "                \"search\": \"stock\"," +
                "                \"precision\": \"hard\"" +
                "            }," +
                "            {" +
                "                \"keyword\": \"rich businessman\"," +
                "                \"search\": \"stock\"," +
                "                \"precision\": \"normal\"" +
                "            }," +
                "            {" +
                "                \"keyword\": \"money\"," +
                "                \"search\": \"stock\"," +
                "                \"precision\": \"easy\"" +
                "            }" +
                "        ]" +
                "    }," +
                "    {" +
                "        \"id\": 2," +
                "        \"keywords\": [" +
                "            {" +
                "                \"keyword\": \"South Africa map\"," +
                "                \"search\": \"stock\"," +
                "                \"precision\": \"hard\"" +
                "            }," +
                "            {" +
                "                \"keyword\": \"African city aerial\"," +
                "                \"search\": \"stock\"," +
                "                \"precision\": \"normal\"" +
                "            }," +
                "            {" +
                "                \"keyword\": \"Africa\"," +
                "                \"search\": \"stock\"," +
                "                \"precision\": \"easy\"" +
                "            }" +
                "        ]" +
                "    }," +
                "..." +
                "]" +

                "YOU MUST REPLY ONLY WITH JSON" +
                "RESPECT THE RESPONSE STRUCTURE" +
                "NO INTRODUCTION LIKE \"Here is the json...\"" +

                "Video script:" + JSON.stringify(sequences),
        });

        console.log("Result", result);

        const jsonResponse = JSON.parse(result.text);

        const cost = calculateAnthropicCost(result.usage)

        const data = {
            keywords: jsonResponse,
            cost
        }

        return data
    } catch (error) {
        console.error(error)
        return null
    }
}