import { logger } from "@trigger.dev/sdk/v3";
import { getGoogleImagesMedia } from "../lib/google";
import { getPexelsVideosMedia } from "../lib/pexels";
import { getStoryblocksVideosMedia } from "../lib/storyblocks";
import { IMedia } from "../types/video";

export const searchMediaForSequence = async (sequence: any, index: number, keywords: any, mediaSource: string) => {
    const sequenceKeywords = keywords[index]?.keywords;
    
    // Si on a déjà un média, on ajoute juste les mots-clés et on retourne la séquence
    if (sequence.media) {
        return { ...sequence, keywords: sequenceKeywords };
    }

    // Si pas de mots-clés, retourner la séquence telle quelle
    if (!sequenceKeywords) return sequence;

    for (const keyword of sequenceKeywords) {
      let media: any[] = [];
      if (keyword.search === 'stock') {
        if (mediaSource === "PEXELS") {
          media = await getPexelsVideosMedia(keyword.keyword, 5, 1);
        } else if (mediaSource === "STORYBLOCKS") {
          media = await getStoryblocksVideosMedia(keyword.keyword, 5, 1);
        }
      } else if (keyword.search === 'web') {
        media = await getGoogleImagesMedia(keyword.keyword, 5, 1);
      }

      if (media.length > 0) {
        logger.info('Mot clé utilisé', { keyword })
        const randomMedia = media[Math.floor(Math.random() * media.length)];
        logger.log('Media', { media: randomMedia })
        return { ...sequence, media: randomMedia, keywords: sequenceKeywords };
      }
    }
    
    return sequence;
};

/**
 * Récupère une liste de médias pour tous les mots clés donnés
 * @param keywords Objet avec un tableau de mots clés { keywords: [string, string, ...] }
 * @param mediaSource Source des médias (PEXELS ou STORYBLOCKS)
 * @param mediaCount Nombre de médias à récupérer
 * @returns Liste de médias avec leurs mots clés associés
 */
export const searchMediaForKeywords = async (keywords: any, mediaSource: string, mediaCount: number) => {

  const searchPromises = keywords.map(async (keyword: string) => {
    if (!keyword) return [];
    
    try {
      
      // Récupérer 6 vidéos pour ce mot clé
      let mediasResult: any[] = [];
      if (mediaSource === "PEXELS") {
        mediasResult = await getPexelsVideosMedia(keyword, mediaCount, 1);
      } else if (mediaSource === "STORYBLOCKS") {
        mediasResult = await getStoryblocksVideosMedia(keyword, mediaCount, 1);
      }
      
      // Convertir les résultats au format attendu
      const formattedResults = mediasResult.map(mediaItem => ({
        media: {
          ...mediaItem,
          usage: 'media',
        } as IMedia,
        keyword
      }));
      
      return formattedResults;
    } catch (error) {
      logger.error('Erreur lors de la recherche de médias', { 
        keyword, 
        error: error instanceof Error ? error.message : String(error) 
      });
      return [];
    }
  });
  
  // Attendre que toutes les recherches se terminent en parallèle
  const resultsArrays = await Promise.all(searchPromises);
  
  // Aplatir le tableau de tableaux en un seul tableau de résultats
  const results = resultsArrays.flat();
  
  return results;
};

export const mediaToMediaSpace = (medias: IMedia[], userId: string) => {
  return medias.map((media) => {
    return {
      media,
      uploadedBy: userId,
      uploadedAt: new Date()
    }
  })
}