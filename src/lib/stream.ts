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
      console.log(response)
      throw new Error('Failed to generate script');
    }

    const data = response.body

    if (!data) {
      throw new Error('Failed to generate script');
    }

    return data
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
      console.log(response)
      throw new Error('Failed to generate script');
    }

    const data = response.body

    if (!data) {
      throw new Error('Failed to generate script');
    }

    return data
  } catch (error) {
    console.error('Error generating script:', error);
    throw error;
  }
};
  
export const readStream = async (stream: ReadableStream, onChunkValue: (chunk: string) => void) => {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: false });

  try {
      let result = ''
      while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          result += chunk
          onChunkValue(result); // Passer chaque morceau individuellement pour conserver la disposition
      }
  } catch (error) {
      console.error('Error reading stream', error);
  } finally {
      reader.releaseLock();
  }
}
