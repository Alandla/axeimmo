import axios from 'axios';

const MODEL = "eleven_flash_v2_5"

export const createAudioTTS = async (voiceId: string, text: string, voiceSettings?: { stability: number, similarity_boost: number }, previousText?: string, nextText?: string) => {
    try {

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
            model_id: MODEL,
            voice_settings: {
                stability: voiceSettings?.stability || 0.5,
                similarity_boost: voiceSettings?.similarity_boost || 0.75,
                use_speaker_boost: true
            },
            previous_text: previousText,
            next_text: nextText,
            apply_text_normalization: 'auto'
        };

        const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, data, options)

        if (response.status !== 200) {
            console.log("response", response)
            throw new Error(`Eleven Labs API returned status code ${response.status}`);
        }

        return response.data;
    } catch (error: any) {
        console.error('Error generate Text to speech', error.response ? error.response.data : error.message)
        throw error
    }
}
