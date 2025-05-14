export function simplifySequences(sequences: any[]) {
  return sequences.map((seq, index) => ({
    sequence_id: String(index),
    text: seq.text,
    b_roll_description: seq.media?.description?.[0]?.text || ""
  }));
}

export function simplifyMediaFromPexels(result: any[]): any[] {
  return result.map((r, index) => ({
    id: index,
    description: r.media.description?.[0]?.text || ''
  }));
}

/**
 * Convertit les médias Google au format simplifié pour l'IA
 * @param medias Liste des médias Google à simplifier
 * @param startIndex Index de départ pour la numérotation (pour continuer après les médias de stock)
 * @returns Liste des médias simplifiés
 */
export function simplifyGoogleMedias(medias: any[], startIndex: number = 0): any[] {
  return medias.map((media, index) => ({
    id: startIndex + index,
    description: media.description?.[0]?.text || ''
  }));
}

export interface ShowBrollResult {
  cost: number;
  show: Array<{
    id: number;
    show: 'full' | 'half' | 'hide';
  }>;
}