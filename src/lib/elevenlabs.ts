import axios from 'axios';
import { calculateElevenLabsCost } from './cost';

const MODEL = "eleven_multilingual_v2"
const MODEL_TURBO = "eleven_flash_v2_5"

// Check if text is in French by looking for common French words/patterns
const isFrenchText = (text: string): boolean => {
    const frenchWords = [
        'le', 'la', 'les', 'de', 'du', 'des', 'et', 'ou', 'à', 'au', 'aux', 'dans', 'sur', 'avec', 
        'pour', 'par', 'sans', 'sous', 'vers', 'chez', 'entre', 'pendant', 'après', 'avant',
        'est', 'sont', 'était', 'ont', 'avez', 'avoir', 'être', 'faire', 'dire', 'aller',
        'voir', 'savoir', 'pouvoir', 'falloir', 'vouloir', 'venir', 'prendre', 'donner',
        'mettre', 'tenir', 'sembler', 'laisser', 'devenir', 'rester', 'partir', 'sortir',
        'passer', 'porter', 'montrer', 'demander', 'continuer', 'pensé', 'regarder',
        'suivre', 'connaître', 'parler', 'aimer', 'arrêter', 'essayer', 'expliquer', 
        'propriété', 'piscine', 'séjour', 'jardin', 'chambres', 'chambre', 'maison', 'appartement',
        'villa', 'terrain', 'surface', 'habitable', 'cuisine', 'salle', 'bain', 'bains', 'toilettes',
        'garage', 'parking', 'cave', 'grenier', 'combles', 'balcon', 'terrasse', 'logement', 
        'studio', 'duplex', 'triplex', 'pavillon', 'résidence', 'immeuble', 'étage',
        'rez-de-chaussée', 'sous-sol', 'mezzanine', 'véranda', 'buanderie', 'dressing', 'placard',
        'fenêtre', 'fenêtres', 'porte', 'portes', 'cloison', 'mur', 'murs', 'plafond', 'sol',
        'carrelage', 'parquet', 'chauffage', 'climatisation', 'électricité', 'plomberie',
        'rénovation', 'travaux', 'aménagement', 'décoration', 'meublé', 'vide', 'neuf', 'ancien'
    ];
    
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);
    
    // Count French words in the text
    let frenchWordCount = 0;
    for (const word of words) {
        // Remove punctuation for word matching
        const cleanWord = word.replace(/[^\w]/g, '');
        if (frenchWords.includes(cleanWord)) {
            frenchWordCount++;
        }
    }
    
    // Consider it French if at least 15% of words are French words
    return words.length > 0 && (frenchWordCount / words.length) >= 0.15;
};

// Clean text for better French pronunciation
const cleanFrenchText = (text: string): string => {
    if (!isFrenchText(text)) {
        return text;
    }
    
    // Replace m² with "mètre carré" for better pronunciation
    return text.replace(/m²/g, ' mètre carré');
};

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
        // Clean French text for better pronunciation
        const cleanedText = cleanFrenchText(text);
        
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
            text: cleanedText,
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
