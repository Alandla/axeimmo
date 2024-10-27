import { StreamData } from 'ai';
import { calculateAnthropicCost } from './cost';

export const generateScript = async (prompt: string, selectedDuration: number) => {
  try {
    const response = await fetch("/api/ai/generateScript", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            duration: selectedDuration,
        }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate script');
    }

    return response.body;
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
};

export const improveScript = async (prompt: string, messagesList: any[]) => {
  try {

    const response = await fetch("/api/ai/improveScript", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            prompt,
            messagesList,
        }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate script');
    }

    return response.body;
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
};
  
export const readStream = async (
  stream: ReadableStream, 
  onChunkValue: (chunk: string) => void
): Promise<{ text: string; cost: number | null }> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8");
  let totalCost: number | null = null;

  try {
      let result = '';
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const parts = chunk.split('\n').filter(Boolean);
          
          for (const part of parts) {
            const firstColonIndex = part.indexOf(':');
            const type = part.slice(0, firstColonIndex);
            const rawContent = part.slice(firstColonIndex + 1);
            
            switch (type) {
              case '0':
                  try {
                    const content = rawContent.slice(1, -1)
                      .replace(/\\"/g, '"')
                      .replace(/\\n/g, '\n');
                    result += content;
                    onChunkValue(result);
                  } catch (parseError) {
                    console.error('Error parsing text content:', parseError);
                  }
                  break;
                case '2':
                  try {
                    const data = JSON.parse(rawContent);
                    console.log('data:', data)
                    console.log('usage:', data[0].usage)
                    if (data[0]?.usage) {
                      totalCost = calculateAnthropicCost(data[0].usage);
                      console.log('Cost:', totalCost);
                    }
                  } catch (parseError) {
                    console.error('Error parsing data:', parseError);
                  }
                  break;
            }
          }
      }
      return { text: result, cost: totalCost };
  } catch (error) {
      console.error('Error reading stream', error);
      throw error;
  } finally {
      reader.releaseLock();
  }
}
