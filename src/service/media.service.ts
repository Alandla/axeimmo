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
 * @param preferVertical Préfère les vidéos verticales (true par défaut)
 * @returns Liste de médias avec leurs mots clés associés
 */
export const searchMediaForKeywords = async (keywords: any, mediaSource: string, mediaCount: number, preferVertical: boolean = true) => {

  const searchPromises = keywords.map(async (keyword: string) => {
    if (!keyword) return [];
    
    try {
      
      // Récupérer 6 vidéos pour ce mot clé
      let mediasResult: any[] = [];
      if (mediaSource === "PEXELS") {
        mediasResult = await getPexelsVideosMedia(keyword, mediaCount, 1, preferVertical);
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

/**
 * Récupère une liste d'images Google pour toutes les requêtes données
 * @param queries Liste des requêtes de recherche d'images
 * @param mediaCount Nombre d'images à récupérer par requête (défaut: 5)
 * @returns Liste d'images avec leurs requêtes associées
 */
export const searchGoogleImagesForQueries = async (queries: { query?: string }[], mediaCount: number = 5) => {
  const searchPromises = queries.map(async (queryObj) => {
    if (!queryObj.query) return [];
    
    try {
      // Récupérer les images pour cette requête
      const imagesResult = await getGoogleImagesMedia(queryObj.query, mediaCount, 1);
      
      // Convertir les résultats au format attendu
      const formattedResults = imagesResult.map(mediaItem => ({
        media: {
          ...mediaItem,
          usage: 'media',
        } as IMedia,
        query: queryObj.query
      }));
      
      return formattedResults;
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'images Google', { 
        query: queryObj.query, 
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