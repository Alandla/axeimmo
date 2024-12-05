import axios from 'axios';

const MODEL = "eleven_multilingual_v2"

export const createAudioTTS = async (voiceId: string, text: string) => {
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
                stability: 0.5,
                similarity_boost: 0.5
            },
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
