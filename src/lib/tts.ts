import { createAudioTTS } from './elevenlabs';
import { createMinimaxTTS } from './minimax';
import { uploadToS3Audio } from './r2';
import { Voice } from '../types/voice';

export const createTextToSpeech = async (
  voice: Voice,
  text: string,
  turbo: boolean = true,
  previousText?: string,
  nextText?: string
): Promise<{ audioUrl: string, cost: number }> => {
  try {
    let result: { data: any, cost: number };
    
    // Get audio data according to mode
    if (voice.mode === 'minimax') {
      result = await createMinimaxTTS(
        voice.id,
        text,
        voice.language
      );
    } else {
      // Default to ElevenLabs for all other voices
      result = await createAudioTTS(
        voice.id,
        text,
        voice.voiceSettings,
        turbo,
        previousText,
        nextText
      );
    }
    
    // Upload to S3 and return URL
    const audioUrl = await uploadToS3Audio(result.data, 'medias-users');
    
    return {
      audioUrl,
      cost: result.cost
    };
  } catch (error) {
    console.error('Error in createTextToSpeech:', error);
    throw error;
  }
}; 