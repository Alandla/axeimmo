import { create } from 'zustand'
import { IVideo } from '../types/video'
import { basicApiCall } from '@/src/lib/api'
import { GenericFilter } from '@/src/components/ui/generic-filters'
import { VideoFilterType } from '@/src/types/filters'

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
}

interface VideosStoreState {
  videosBySpace: Map<string, Map<string, IVideo[]>>
  paginationBySpace: Map<string, Map<string, PaginationInfo>>
  totalVideoCountBySpace: Map<string, number>
  setVideos: (spaceId: string, cacheKey: string, videos: IVideo[], paginationInfo: PaginationInfo) => void
  getCachedVideos: (spaceId: string, page?: number, limit?: number, filters?: GenericFilter<VideoFilterType>[]) => { 
    videos: IVideo[], 
    totalCount: number,
    currentPage: number,
    totalPages: number
  } | null
  fetchVideos: (spaceId: string, page?: number, limit?: number, filters?: GenericFilter<VideoFilterType>[], forceRefresh?: boolean) => Promise<{ 
    videos: IVideo[], 
    totalCount: number,
    currentPage: number,
    totalPages: number
  }>
  fetchVideosInBackground: (spaceId: string, page?: number, limit?: number, filters?: GenericFilter<VideoFilterType>[]) => Promise<{ 
    videos: IVideo[], 
    totalCount: number,
    currentPage: number,
    totalPages: number
  }>
  fetchTotalVideoCount: (spaceId: string) => Promise<number>
  clearSpaceCache: (spaceId: string) => void
  clearSpecificCache: (spaceId: string, cacheKey: string) => void
}

// Fonction pour créer une clé de cache basée sur la page et les filtres
const createCacheKey = (page: number, filters?: GenericFilter<VideoFilterType>[]): string => {
  const filtersStr = filters && filters.length > 0 
    ? JSON.stringify(filters.map(f => ({ type: f.type, operator: f.operator, value: f.value })))
    : 'no-filters';
  return `page-${page}-filters-${filtersStr}`;
};

export const useVideosStore = create<VideosStoreState>((set, get) => ({
  videosBySpace: new Map(),
  paginationBySpace: new Map(),
  totalVideoCountBySpace: new Map(),
  
  setVideos: (spaceId: string, cacheKey: string, videos: IVideo[], paginationInfo: PaginationInfo) => {
    set(state => {
      const newVideosBySpace = new Map(state.videosBySpace);
      const newPaginationBySpace = new Map(state.paginationBySpace);
      
      if (!newVideosBySpace.has(spaceId)) {
        newVideosBySpace.set(spaceId, new Map());
      }
      
      if (!newPaginationBySpace.has(spaceId)) {
        newPaginationBySpace.set(spaceId, new Map());
      }
      
      const spaceVideos = newVideosBySpace.get(spaceId)!;
      const spacePagination = newPaginationBySpace.get(spaceId)!;
      
      spaceVideos.set(cacheKey, videos);
      spacePagination.set(cacheKey, paginationInfo);
      
      return { 
        videosBySpace: newVideosBySpace,
        paginationBySpace: newPaginationBySpace
      };
    });
  },
  
  getCachedVideos: (spaceId: string, page?: number, limit?: number, filters?: GenericFilter<VideoFilterType>[]) => {
    const state = get();
    const cacheKey = createCacheKey(page || 1, filters);
    const cachedVideos = state.videosBySpace.get(spaceId)?.get(cacheKey);
    const cachedPagination = state.paginationBySpace.get(spaceId)?.get(cacheKey);
    
    if (cachedVideos && cachedPagination) {
      return { 
        videos: cachedVideos, 
        totalCount: cachedPagination.totalCount,
        currentPage: cachedPagination.currentPage,
        totalPages: cachedPagination.totalPages
      };
    }
    
    return null;
  },
  
  fetchVideos: async (spaceId: string, page: number = 1, limit: number = 20, filters?: GenericFilter<VideoFilterType>[], forceRefresh: boolean = false) => {
    console.log("filters", filters);
    const cacheKey = createCacheKey(page, filters);
    
    // Si forceRefresh est false, on vérifie le cache d'abord
    if (!forceRefresh) {
      const state = get();
      const cachedVideos = state.videosBySpace.get(spaceId)?.get(cacheKey);
      const cachedPagination = state.paginationBySpace.get(spaceId)?.get(cacheKey);
      
      if (cachedVideos && cachedPagination) {
        return { 
          videos: cachedVideos, 
          totalCount: cachedPagination.totalCount,
          currentPage: cachedPagination.currentPage,
          totalPages: cachedPagination.totalPages
        };
      }
    }
    
    try {
      const { videos, totalCount, currentPage, totalPages } = await basicApiCall('/space/getVideos', { 
        spaceId, 
        page, 
        limit,
        filters
      }) as { 
        videos: IVideo[], 
        totalCount: number,
        currentPage: number,
        totalPages: number
      };

      get().setVideos(spaceId, cacheKey, videos, { currentPage, totalPages, totalCount });
      
      return { videos, totalCount, currentPage, totalPages };
    } catch (error) {
      console.error('Erreur lors de la récupération des vidéos:', error);

      // En cas d'erreur, on essaie de retourner le cache si disponible
      const state = get();
      const cachedVideos = state.videosBySpace.get(spaceId)?.get(cacheKey);
      const cachedPagination = state.paginationBySpace.get(spaceId)?.get(cacheKey);
      
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
  
  fetchVideosInBackground: async (spaceId: string, page: number = 1, limit: number = 20, filters?: GenericFilter<VideoFilterType>[]) => {
    console.log("Background fetch - filters", filters);
    const cacheKey = createCacheKey(page, filters);
    
    try {
      const { videos, totalCount, currentPage, totalPages } = await basicApiCall('/space/getVideos', { 
        spaceId, 
        page, 
        limit,
        filters
      }) as { 
        videos: IVideo[], 
        totalCount: number,
        currentPage: number,
        totalPages: number
      };

      get().setVideos(spaceId, cacheKey, videos, { currentPage, totalPages, totalCount });
      
      return { videos, totalCount, currentPage, totalPages };
    } catch (error) {
      console.error('Erreur lors de la récupération des vidéos en arrière-plan:', error);
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
  },
  
  clearSpecificCache: (spaceId: string, cacheKey: string) => {
    set(state => {
      const newVideosBySpace = new Map(state.videosBySpace);
      const newPaginationBySpace = new Map(state.paginationBySpace);
      
      // Supprimer les données spécifiques à cette clé de cache
      if (newVideosBySpace.has(spaceId)) {
        const spaceVideos = new Map(newVideosBySpace.get(spaceId)!);
        spaceVideos.delete(cacheKey);
        newVideosBySpace.set(spaceId, spaceVideos);
      }
      
      if (newPaginationBySpace.has(spaceId)) {
        const spacePagination = new Map(newPaginationBySpace.get(spaceId)!);
        spacePagination.delete(cacheKey);
        newPaginationBySpace.set(spaceId, spacePagination);
      }
      
      return {
        videosBySpace: newVideosBySpace,
        paginationBySpace: newPaginationBySpace,
      };
    });
  }
})) 