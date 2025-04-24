import { logger } from "@trigger.dev/sdk/v3";
import { getGoogleImagesMedia } from "../lib/google";
import { getPexelsVideosMedia } from "../lib/pexels";
import { getStoryblocksVideosMedia } from "../lib/storyblocks";
import { IMedia } from "../types/video";

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