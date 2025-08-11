import { createAudioTTS } from './elevenlabs';
import { createMinimaxTTS } from './minimax';
import { uploadToS3Audio } from './r2';
import { Voice } from '../types/voice';

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

export const createTextToSpeech = async (
  voice: Voice,
  text: string,
  turbo: boolean = true,
  previousText?: string,
  nextText?: string
): Promise<{ audioUrl: string, cost: number }> => {
  try {
    // Clean French text for better pronunciation (applies to both services)
    const cleanedText = cleanFrenchText(text);
    
    let result: { data: any, cost: number };
    
    // Get audio data according to mode
    if (voice.mode === 'minimax') {
      result = await createMinimaxTTS(
        voice.id,
        cleanedText,
        voice.language
      );
    } else {
      // Default to ElevenLabs for all other voices
      result = await createAudioTTS(
        voice.id,
        cleanedText,
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