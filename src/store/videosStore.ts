import { create } from 'zustand'
import { IVideo } from '../types/video'
import { basicApiCall } from '@/src/lib/api'

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
}

interface VideosStoreState {
  videosBySpace: Map<string, Map<number, IVideo[]>>
  paginationBySpace: Map<string, PaginationInfo>
  totalVideoCountBySpace: Map<string, number>
  setVideos: (spaceId: string, page: number, videos: IVideo[], paginationInfo: PaginationInfo) => void
  fetchVideos: (spaceId: string, page?: number, limit?: number, forceRefresh?: boolean) => Promise<{ 
    videos: IVideo[], 
    totalCount: number,
    currentPage: number,
    totalPages: number
  }>
  fetchTotalVideoCount: (spaceId: string) => Promise<number>
  clearSpaceCache: (spaceId: string) => void
}

export const useVideosStore = create<VideosStoreState>((set, get) => ({
  videosBySpace: new Map(),
  paginationBySpace: new Map(),
  totalVideoCountBySpace: new Map(),
  
  setVideos: (spaceId: string, page: number, videos: IVideo[], paginationInfo: PaginationInfo) => {
    set(state => {
      const newVideosBySpace = new Map(state.videosBySpace);
      const newPaginationBySpace = new Map(state.paginationBySpace);
      
      if (!newVideosBySpace.has(spaceId)) {
        newVideosBySpace.set(spaceId, new Map());
      }
      
      const spaceVideos = newVideosBySpace.get(spaceId)!;
      spaceVideos.set(page, videos);
      
      newPaginationBySpace.set(spaceId, paginationInfo);
      
      return { 
        videosBySpace: newVideosBySpace,
        paginationBySpace: newPaginationBySpace
      };
    });
  },
  
  fetchVideos: async (spaceId: string, page: number = 1, limit: number = 20, forceRefresh: boolean = false) => {
    const state = get();
    const cachedVideos = state.videosBySpace.get(spaceId)?.get(page);
    const cachedPagination = state.paginationBySpace.get(spaceId);
    
    if (!forceRefresh && cachedVideos && cachedPagination) {
      return { 
        videos: cachedVideos, 
        totalCount: cachedPagination.totalCount,
        currentPage: cachedPagination.currentPage,
        totalPages: cachedPagination.totalPages
      };
    }
    
    try {
      const { videos, totalCount, currentPage, totalPages } = await basicApiCall('/space/getVideos', { 
        spaceId, 
        page, 
        limit 
      }) as { 
        videos: IVideo[], 
        totalCount: number,
        currentPage: number,
        totalPages: number
      };

      get().setVideos(spaceId, page, videos, { currentPage, totalPages, totalCount });
      
      return { videos, totalCount, currentPage, totalPages };
    } catch (error) {
      console.error('Erreur lors de la récupération des vidéos:', error);

      if (cachedVideos && cachedPagination) {
        return { 
          videos: cachedVideos, 
          totalCount: cachedPagination.totalCount,
          currentPage: cachedPagination.currentPage,
          totalPages: cachedPagination.totalPages
        };
      }

      throw error;
    }
  },
  
  fetchTotalVideoCount: async (spaceId: string) => {
    const state = get();
    const cachedCount = state.totalVideoCountBySpace.get(spaceId);
    
    if (cachedCount !== undefined) {
      return cachedCount;
    }
    
    try {
      const { totalCount } = await basicApiCall('/space/videoCount', { spaceId }) as { totalCount: number };
      
      set(state => {
        const newTotalVideoCountBySpace = new Map(state.totalVideoCountBySpace);
        newTotalVideoCountBySpace.set(spaceId, totalCount);
        return { totalVideoCountBySpace: newTotalVideoCountBySpace };
      });
      
      return totalCount;
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre total de vidéos:', error);
      throw error;
    }
  },
  
  clearSpaceCache: (spaceId: string) => {
    set(state => {
      const newVideosBySpace = new Map(state.videosBySpace);
      const newPaginationBySpace = new Map(state.paginationBySpace);
      const newTotalVideoCountBySpace = new Map(state.totalVideoCountBySpace);
      
      newVideosBySpace.delete(spaceId);
      newPaginationBySpace.delete(spaceId);
      newTotalVideoCountBySpace.delete(spaceId);
      
      return {
        videosBySpace: newVideosBySpace,
        paginationBySpace: newPaginationBySpace,
        totalVideoCountBySpace: newTotalVideoCountBySpace
      };
    });
  }
})) 