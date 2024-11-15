import { logger } from "@trigger.dev/sdk/v3";
import { getGoogleImagesMedia } from "../lib/google";
import { getPexelsVideosMedia } from "../lib/pexels";

export const searchMediaForSequence = async (sequence: any, index: number, keywords: any) => {
    const sequenceKeywords = keywords[index - 1]?.keywords;
    if (!sequenceKeywords) return sequence;

    for (const keyword of sequenceKeywords) {
      let media: any[] = [];
      if (keyword.search === 'stock') {
        media = await getPexelsVideosMedia(keyword.keyword, 5, 1);
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