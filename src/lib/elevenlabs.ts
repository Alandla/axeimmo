import axios from 'axios';
import { calculateElevenLabsCost } from './cost';

const MODEL = "eleven_multilingual_v2"
const MODEL_TURBO = "eleven_flash_v2_5"

// Check if text contains numbers or m²
const shouldUseClassicModel = (text: string): boolean => {
    // Check for numbers (including decimals and negative numbers)
    const hasNumbers = /\d/.test(text);
    // Check for m² (square meters)
    const hasSquareMeters = /m²/.test(text);
    
    return hasNumbers || hasSquareMeters;
};

export const createAudioTTS = async (voiceId: string, text: string, voiceSettings?: { stability: number, similarity_boost: number }, turbo: boolean = true, previousText?: string, nextText?: string ): Promise<{ data: any, cost: number }> => {
    try {
        // Determine which model to use
        let selectedModel = MODEL; // Default to classic model
        let isUsingTurbo = false;
        
        if (turbo) {
            // Only check for numbers/m² if turbo is requested (use original text for model selection)
            const useClassicModel = shouldUseClassicModel(text);
            selectedModel = useClassicModel ? MODEL : MODEL_TURBO;
            isUsingTurbo = !useClassicModel;
        }

        const options = {
            headers: {
                "Accept": "audio/mpeg",
                'xi-api-key': process.env.XI_API_KEY,
                'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer' as const
        };

        const data = {
            text: text,
            model_id: selectedModel,
            voice_settings: {
                stability: voiceSettings?.stability || 0.5,
                similarity_boost: voiceSettings?.similarity_boost || 0.75,
                use_speaker_boost: true
            },
            apply_text_normalization: 'auto'
        };

        const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, data, options)

        if (response.status !== 200) {
            console.log("response", response)
            throw new Error(`Eleven Labs API returned status code ${response.status}`);
        }

        // Calculate cost based on the model used and original text length
        const cost = calculateElevenLabsCost(text, isUsingTurbo);

        return {
            data: response.data,
            cost: cost
        };
    } catch (error: any) {
        console.error('Error generate Text to speech', error.response ? error.response.data : error.message)
        throw error
    }
}
