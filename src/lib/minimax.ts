import axios from 'axios';
import { calculateMinimaxCost } from './cost';

const MODEL = "speech-02-turbo";
const DEFAULT_SPEED = 1.18;

// Map language codes to Minimax language boost values
const getLanguageBoost = (language: string): string => {
  const languageMap: Record<string, string> = {
    'english': 'en',
    'chinese': 'zh',
    'japanese': 'ja',
    'korean': 'ko',
    'spanish': 'es',
    'portuguese': 'pt',
    'french': 'fr',
    'german': 'de',
    'italian': 'it',
    'russian': 'ru',
    'dutch': 'nl',
    'arabic': 'ar',
    'turkish': 'tr',
    'ukrainian': 'uk',
    'thai': 'th',
    'polish': 'pl',
    'romanian': 'ro',
    'greek': 'el',
    'czech': 'cs',
    'finnish': 'fi',
    'hindi': 'hi',
    'indonesian': 'id',
    'vietnamese': 'vi'
  };
  
  return languageMap[language.toLowerCase()] || 'en';
};

export const createMinimaxTTS = async (
  voiceId: string, 
  text: string, 
  language: string = 'english',
  speed: number = DEFAULT_SPEED
): Promise<{ data: any, cost: number }> => {
  try {
    const options = {
      headers: {
        'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const data = {
      model: MODEL,
      text: text,
      voice_setting: {
        voice_id: voiceId,
        speed: speed,
        vol: 1.0,
        pitch: 0
      },
      audio_setting: {
        sample_rate: 24000,
        bitrate: 128000,
        format: "mp3",
        channel: 1
      },
      language_boost: getLanguageBoost(language),
      output_format: "hex"
    };

    // Ajouter le GroupId à l'URL (utilisation du GroupID depuis le token JWT)
    const response = await axios.post(
      `https://api.minimax.io/v1/t2a_v2?GroupId=${process.env.MINIMAX_GROUP_ID}`, 
      data, 
      options
    );

    if (response.status !== 200) {
      console.log("Minimax API response", response);
      throw new Error(`Minimax API returned status code ${response.status}`);
    }

    const responseData = response.data;
    
    // Vérifier les erreurs dans base_resp
    if (responseData.base_resp && responseData.base_resp.status_code !== 0) {
      throw new Error(`Minimax API error: ${responseData.base_resp.status_msg} (code: ${responseData.base_resp.status_code})`);
    }

    const cost = calculateMinimaxCost(text);

    // Convert hex audio data to buffer
    let audioBuffer = null;
    if (responseData.data && responseData.data.audio) {
      // Convert hex string to buffer
      audioBuffer = Buffer.from(responseData.data.audio, 'hex');
    }

    if (!audioBuffer) {
      throw new Error('No audio data received from Minimax API');
    }

    return {
      data: audioBuffer,
      cost: cost
    };
  } catch (error: any) {
    console.error('Error generating Minimax Text to Speech', error.response ? error.response.data : error.message);
    throw error;
  }
}; 