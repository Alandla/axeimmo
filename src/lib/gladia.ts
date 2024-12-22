import axios from 'axios';
import FormData from 'form-data';

export const getTranscription = async (transcriptionId: string) => {

  try {
    const response = await axios.get(`https://api.gladia.io/v2/transcription/${transcriptionId}`, {
      headers: {
        'x-gladia-key': process.env.GLADIA_SECRET_KEY,
      },
    });

    return response.data;

  } catch (error: any) {
    console.error('Error transcribe audio:', error.response ? error.response.data : error.message);
  }

}

export const createTranscription = async (audioUrl: string, text?: string) => {

  try {
    const response = await axios.post('https://api.gladia.io/v2/transcription', {
      audio_url: audioUrl,
      context_prompt: text ? "Here's the original audio text, base your transcription on it: " + text : undefined
    }, {
      headers: {
        'x-gladia-key': process.env.GLADIA_SECRET_KEY,
        'Content-Type': 'application/json'
      },
    });

    return response.data;

  } catch (error: any) {
    console.error('Error transcribe audio:', error.response ? error.response.data : error.message);
  }

}