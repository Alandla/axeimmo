import { logger } from '@trigger.dev/sdk/v3';
import { createClient, Photo, Video } from 'pexels';

export const getVideoPexels = async (keyword: string, nb: number, page: number) => {
    const client = createClient(process.env.PEXELS_API_KEY!);
    const videoResult = client.videos.search(
        { 
            query: keyword,
            per_page: nb,
            page: page
        }
    );
    return videoResult;
}

export const getImagePexels = async (keyword: string, nb: number, page: number) => {
    const client = createClient(process.env.PEXELS_API_KEY!);
    const imageResult = client.photos.search(
        { 
            query: keyword,
            per_page: nb,
            page: page
        }
    );
    return imageResult;
}

export const getPexelsVideosMedia = async (keyword: string, number: number, page: number) => {
    const videos = await getVideoPexels(keyword, number, page)
    if ('videos' in videos) {
        const videoBestQuality = getVideosBestQuality(videos.videos);
        logger.log('Video best quality', { videoBestQuality })
        return pexelVideoToMedia(videoBestQuality);
    }
    return [];
}

export const getPexelsImagesMedia = async (keyword: string, number: number, page: number) => {
    const images = await getImagePexels(keyword, number, page)
    if ('photos' in images) {
        return pexelImageToMedia(images.photos);
    }
    return [];
}

export function pexelImageToMedia(images: Photo[]) {
    return images.map(image => {
      return {
        type: "image",
        name: image.alt,
        image: {
          id: image.id,
          link: image.src.large2x,
          height: image.height,
          width: image.width,
        },
      };
    });
}

export function pexelVideoToMedia(videos: any[]) {
  return videos.map(video => {
    return {
      type: "video",
      image: {
        id: video.id,
        link: video.image,
        height: video.height,
        width: video.width,
      },
      video: {
        ...video.videoBestQuality,
        link: video.videoBestQuality.link
      }
    };
  });
}

export function getVideosBestQuality(videos: Video[]) {
  return videos
    .map(video => {
      const bestQualityVideo = getBestQualityVideo(video.video_files);
      if (bestQualityVideo) {
        const { video_files, ...rest } = video;
        return { ...rest, videoBestQuality: bestQualityVideo };
      }
      return null;
    })
    .filter(video => video !== null);
}

export const getBestQualityVideo = (videos: any[]) => {
    // Filtrer pour éliminer les vidéos de qualité "sd"
    const hdVideos = videos.filter(video => video.quality !== 'sd' && video.quality !== 'uhd' && video.height !== null);
  
    if (!hdVideos || hdVideos.length === 0) return null;
  
    // Objectif de hauteur pour une vidéo 1080p
    const targetHeight = 1920;
  
    // Trier les vidéos HD par proximité avec la hauteur cible (1920 pour 1080p)
    hdVideos.sort((a, b) => {
      const diffA = Math.abs(a.height - targetHeight);
      const diffB = Math.abs(b.height - targetHeight);
  
      if (diffA === diffB) {
        // Si deux vidéos ont la même différence de hauteur, privilégier celle avec le plus grand fps
        return (b.fps || 0) - (a.fps || 0);
      }
  
      // Privilégier la vidéo dont la hauteur est la plus proche de la cible
      return diffA - diffB;
    });
  
    // Retourner la vidéo la plus proche de la hauteur cible
    return hdVideos[0];
  };