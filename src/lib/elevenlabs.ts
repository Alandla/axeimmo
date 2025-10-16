import axios from 'axios';
import { calculateElevenLabsCost } from './cost';

const MODEL = "eleven_multilingual_v2"
const MODEL_TURBO = "eleven_flash_v2_5"
const MODEL_V3 = "eleven_v3"
const MODEL_S2S = "eleven_multilingual_sts_v2"


// Check if text contains numbers or m²
const shouldUseClassicModel = (text: string): boolean => {
    // Check for numbers (including decimals and negative numbers)
    const hasNumbers = /\d/.test(text);
    // Check for m² (square meters)
    const hasSquareMeters = /m²/.test(text);
    
    return hasNumbers || hasSquareMeters;
};

export const createAudioTTS = async (voiceId: string, text: string, voiceSettings?: { stability: number, similarity_boost: number }, turbo: boolean = true, previousText?: string, nextText?: string, voiceEnhancement: boolean = false ): Promise<{ data: any, cost: number }> => {
    try {
        // Determine which model to use
        let selectedModel: string = MODEL; // Default to classic model
        let isUsingTurbo = false;
        
        if (voiceEnhancement) {
            selectedModel = MODEL_V3;
        } else if (turbo) {
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
                stability: voiceEnhancement ? 1 : (voiceSettings?.stability || 0.5),
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

export const voiceChangerFromVideo = async (videoUrl: string, voiceId: string): Promise<Buffer> => {
    try {
        const FormData = require('form-data');
        const form = new FormData();

        const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
        const videoBuffer = Buffer.from(videoResponse.data);

        form.append('audio', videoBuffer, {
            filename: 'video.mp4',
            contentType: 'video/mp4'
        });
        
        form.append('model_id', MODEL_S2S);
        form.append('remove_background_noise', 'true');
        form.append('voice_settings', JSON.stringify({
            stability: 0.5,
            similarity_boost: 0.75,
            use_speaker_boost: true
        }));
        
        const options = {
            headers: {
                'xi-api-key': process.env.XI_API_KEY,
                'Accept': 'audio/mpeg',
                ...form.getHeaders()
            },
            responseType: 'arraybuffer' as const
        };

        const response = await axios.post(
            `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`,
            form,
            options
        );

        console.log("response", response);

        if (response.status !== 200) {
            console.log("response", response);
            throw new Error(`Eleven Labs speech-to-speech API returned status code ${response.status}`);
        }

        return Buffer.from(response.data);
    } catch (error: any) {
        console.error('Error converting video to voice', error.response ? error.response.data : error.message);
        throw error;
    }
}
