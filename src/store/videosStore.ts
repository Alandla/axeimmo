import { create } from 'zustand'
import { IVideo } from '../types/video'
import { VideoWithCreator } from '@/src/app/dashboard/page'
import { basicApiCall } from '@/src/lib/api'

interface VideosStoreState {
  // Stockage des vidéos par spaceId
  videosBySpace: Map<string, VideoWithCreator[]>
  
  // Fonction pour définir les vidéos d'un espace
  setVideos: (spaceId: string, videos: VideoWithCreator[]) => void
  
  // Fonction pour récupérer les vidéos d'un espace
  fetchVideos: (spaceId: string, forceRefresh?: boolean) => Promise<VideoWithCreator[]>
}

export const useVideosStore = create<VideosStoreState>((set, get) => ({
  videosBySpace: new Map(),
  
  setVideos: (spaceId: string, videos: VideoWithCreator[]) => {
    set(state => {
      const newVideosBySpace = new Map(state.videosBySpace);
      newVideosBySpace.set(spaceId, videos);
      return { videosBySpace: newVideosBySpace };
    });
  },
  
  fetchVideos: async (spaceId: string) => {
    
    try {
      // Récupérer les vidéos depuis l'API
      const rawVideos: any[] = await basicApiCall('/space/getVideos', { spaceId });
      
      // Traiter les vidéos
      const processedVideos = rawVideos.map(video => {
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
      
      // Mettre à jour le store
      const sortedVideos = processedVideos.reverse();
      get().setVideos(spaceId, sortedVideos);
      
      return sortedVideos;
    } catch (error) {
      console.error('Erreur lors de la récupération des vidéos:', error);

      const cachedVideos = get().videosBySpace.get(spaceId);
      if (cachedVideos) {
        return cachedVideos;
      }

      throw error;
    }
  }
})) 