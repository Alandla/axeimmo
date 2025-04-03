import { create } from 'zustand'
import { IVideo } from '../types/video'
import { VideoWithCreator } from '@/src/app/dashboard/page'
import { basicApiCall } from '@/src/lib/api'

interface ApiResponse {
  videos: any[];
  totalCount: number;
}

interface VideosStoreState {
  videosBySpace: Map<string, VideoWithCreator[]>
  totalVideoCountBySpace: Map<string, number>
  setVideos: (spaceId: string, videos: VideoWithCreator[], totalCount?: number) => void
  fetchVideos: (spaceId: string, forceRefresh?: boolean) => Promise<{ videos: VideoWithCreator[], totalCount: number }>
}

export const useVideosStore = create<VideosStoreState>((set, get) => ({
  videosBySpace: new Map(),
  totalVideoCountBySpace: new Map(),
  
  setVideos: (spaceId: string, videos: VideoWithCreator[], totalCount?: number) => {
    set(state => {
      const newVideosBySpace = new Map(state.videosBySpace);
      const newTotalVideoCountBySpace = new Map(state.totalVideoCountBySpace);
      newVideosBySpace.set(spaceId, videos);
      if (totalCount) {
        newTotalVideoCountBySpace.set(spaceId, totalCount);
      }
      return { 
        videosBySpace: newVideosBySpace,
        totalVideoCountBySpace: newTotalVideoCountBySpace
      };
    });
  },
  
  fetchVideos: async (spaceId: string) => {
    try {
      const { videos, totalCount } = await basicApiCall<ApiResponse>('/space/getVideos', { spaceId });

      const processedVideos = videos.map(video => {
        const createEvent = video.history?.find((h: { step: string }) => h.step === 'CREATE');
        const userId = createEvent?.user;
        
        return {
          ...video,
          creator: {
            id: userId || '',
            name: '',
            image: ''
          }
        };
      });

      const sortedVideos = processedVideos.reverse();
      get().setVideos(spaceId, sortedVideos, totalCount);
      
      return { videos: sortedVideos, totalCount };
    } catch (error) {
      console.error('Erreur lors de la récupération des vidéos:', error);

      const cachedVideos = get().videosBySpace.get(spaceId);
      const cachedTotalCount = get().totalVideoCountBySpace.get(spaceId);
      if (cachedVideos && cachedTotalCount !== undefined) {
        return { videos: cachedVideos, totalCount: cachedTotalCount };
      }

      throw error;
    }
  }
})) 