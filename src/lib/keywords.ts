import Groq from "groq-sdk";

const client = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const generateKeywords = async (sequences: any) => {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const completion = await client.chat.completions.create({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user", 
                        content: `You are an experienced video editor tasked with generating keywords for illustrating sequences in a video script. These keywords will be used to search for stock footage or web images to match the content of each sequence. Your goal is to create descriptive, searchable keywords that will yield appropriate visual results.

Here is the video script you'll be working with:

<video_script>
${JSON.stringify(sequences)}
</video_script>

Instructions:

1. Read through the entire script to understand the context and overall theme.

2. For each sequence in the script, you will generate three keywords, each with a different level of precision:
   - HARD: Ultra precise, matching exactly what should be displayed
   - NORMAL: More global and straightforward for easy searching
   - EASY: Very simple, to ensure a result while maintaining relevance

3. When generating keywords, keep these important points in mind:
   - Keywords must be in English and as short as possible
   - Focus on describing what should be displayed visually, not necessarily using words from the text
   - Be creative and think like a video editor
   - Maintain the full context of the video when choosing keywords
   - Prioritize keywords that would match stock video content (used 90% of the time)
   - Does not include number
   - Avoid overly specific phrases; instead, use general, descriptive terms
   - Avoid unnecessary precision, keep it simple, (e.g., "tesla car on the road" instead of just "tesla car")
   - Ensure keywords stay within the context of the video (e.g., "minimalist car interior" instead of just "minimalist interior" for a video about cars)

Example of good keywords:
- For "At the age of 17, he left his homeland for Canada, staying with":
* HARD: "plane taking off"
* NORMAL: "Airport departure"
* EASY: "Travel"

Example of keywords to avoid:
- "Leaving home airport" (too specific and not descriptive of the visual)

4. For each keyword, determine the best search method:
   - "stock" for generic, high-quality content (use this 90% of the time)
   - "web" for proper names or trademarks

5. Organize your results into a JSON array with one entry for each sequence. Each entry should include:
   - An "id" field with the sequence number
   - A "keywords" array containing three objects, each with "keyword", "precision", and "search" fields

Before generating keywords for each sequence, wrap your thought process in <keyword_analysis> tags:
1. Identify the sequence number being analyzed
2. Identify the main visual elements in the sequence
3. Consider the overall theme of the video
4. Analyze how this sequence fits into the visual narrative and progression of the video
5. Brainstorm potential stock footage that could match the sequence
6. Brainstorm potential keywords
7. Simplify keywords by removing unnecessary words
8. Ensure keywords align with the video's context
9. Evaluate the searchability of each keyword
10. Refine keywords based on their potential to yield appropriate stock footage results


Your final output should be a valid JSON array, structured as follows:

"sequences": [
  {
    "id": 0,
    "keywords": [
      {
        "keyword": "HARD keyword",
        "precision": "HARD",
        "search": "stock or web"
      },
      {
        "keyword": "NORMAL keyword",
        "precision": "NORMAL",
        "search": "stock or web"
      },
      {
        "keyword": "EASY keyword",
        "precision": "EASY",
        "search": "stock or web"
      }
    ]
  },
  // ... repeat for all ${sequences.length} sequences
]

Remember to focus on creating keywords that will yield appropriate stock video results for the majority of searches. Only use the "web" search method for specific proper names or trademarks that are unlikely to be found in a stock library.

Now, please proceed with analyzing the video script and generating keywords for each sequence.

IMPORTANT: Make sure to generate valid JSON with proper syntax. Double check all brackets and quotes.`
                    }
                ],
                temperature: 1,
                stream: false,
                response_format: { type: "json_object" }
            });

            if (!completion.choices[0].message.content) {
                throw new Error("No response from Groq");
            }

            console.log("Completion", completion);

            const jsonResponse = JSON.parse(completion.choices[0].message.content || "");

            const data = {
                keywords: jsonResponse.sequences,
                cost: 0
            }

            return data;
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