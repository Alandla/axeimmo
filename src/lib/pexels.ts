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
    const videos = await getVideoPexels(keyword, number, page);
    let sdVideoUrl = null;
    if ('videos' in videos) {
        const videoBestQuality = getVideosBestQuality(videos.videos);
        const videoSdQuality = getVideoSdQuality(videos.videos);
        if (videoSdQuality) {
            sdVideoUrl = videoSdQuality.link;
        }
        logger.log('Video best quality', { videoBestQuality });
        return pexelVideoToMedia(videoBestQuality, sdVideoUrl);
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

export function pexelVideoToMedia(videos: any[], sdVideoUrl: string | null) {
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
      },
      sdVideoUrl
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
  
    // Déterminer si la vidéo est verticale ou horizontale et définir la hauteur cible
    const firstVideo = hdVideos[0];
    const targetHeight = firstVideo.height > firstVideo.width ? 1920 : 1080;

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

export function getVideoSdQuality(videos: Video[]) {
    const sdVideos = videos.flatMap(video => video.video_files.filter(file => file.quality === 'sd' && file.height !== null));
    if (!sdVideos || sdVideos.length === 0) return null;
    // Retourner la vidéo SD avec la plus grande résolution
    return sdVideos.reduce((prev, current) => (prev.height! > current.height!) ? prev : current);
}