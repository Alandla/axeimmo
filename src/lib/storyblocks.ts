import { logger } from '@trigger.dev/sdk/v3';
import * as crypto from 'crypto';

interface StoryBlocksVideo {
  id: number;
  title: string;
  type: string;
  thumbnail_url: string;
  preview_urls: {
    _180p: string;
    _360p: string;
    _480p: string;
    _720p: string;
  };
  duration: number;
  is_new: boolean;
}

interface StoryBlocksResponse {
  total_results: number;
  results: StoryBlocksVideo[];
}

export const getVideoStoryblocks = async (keyword: string, nb: number, page: number) => {
    const url = new URL('https://api.videoblocks.com/api/v2/videos/search');
    const timestamp = Math.floor(Date.now() / 1000);
    const apiKey = process.env.STORYBLOCKS_API_KEY!;
    const secret = process.env.STORYBLOCKS_SECRET!;
    
    const params: Record<string, string> = {
        APIKEY: apiKey,
        EXPIRES: (timestamp + 300).toString(),
        user_id: "test",
        project_id: "Hoox",
        keywords: keyword,
        page: page.toString(),
        results_per_page: nb.toString(),
    };

    const hmac = await createHmac(secret);
    params.HMAC = hmac;
    
    url.search = new URLSearchParams(params).toString();
    
    const response = await fetch(url.toString());
    const data = await response.json();
    return data as StoryBlocksResponse;
}

async function createHmac(secret: string): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + 300;
    const hmacBuilder = crypto.createHmac('sha256', secret + expires);
    hmacBuilder.update('/api/v2/videos/search');
    return hmacBuilder.digest('hex');
}

export const getStoryblocksVideosMedia = async (keyword: string, number: number, page: number) => {
    const videos = await getVideoStoryblocks(keyword, number, page);
    logger.log('videos', { videos })
    if (videos.results && videos.results.length > 0) {
        return storyblockVideoToMedia(videos.results);
    }
    return [];
}

export function storyblockVideoToMedia(videos: StoryBlocksVideo[]) {
    return videos.map(video => {
        return {
            type: "video",
            image: {
                id: video.id,
                link: video.thumbnail_url,
                height: 1280, // Valeurs par défaut car non fournies par l'API
                width: 720,
            },
            height: 1280,
            width: 720,
            video: {
                height: 1280,
                width: 720,
                link: video.preview_urls._720p,
                fps: 30, // Valeur par défaut car non fournie par l'API
            }
        };
    });
}
