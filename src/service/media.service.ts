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

export const mediaToMediaSpace = (medias: IMedia[], userId: string) => {
  return medias.map((media) => {
    return {
      media,
      uploadedBy: userId,
      uploadedAt: new Date()
    }
  })
}