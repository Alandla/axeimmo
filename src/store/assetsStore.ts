import { create } from 'zustand'
import { IMediaSpace } from '../types/space'
import { MediaSpaceWithCreator } from '@/src/app/dashboard/assets/page'
import { basicApiCall } from '@/src/lib/api'

interface AssetsStoreState {
  // Stockage des assets par spaceId
  assetsBySpace: Map<string, MediaSpaceWithCreator[]>
  
  // Fonction pour définir les assets d'un espace
  setAssets: (spaceId: string, assets: MediaSpaceWithCreator[]) => void
  
  // Fonction pour récupérer les assets d'un espace
  fetchAssets: (spaceId: string, forceRefresh?: boolean) => Promise<MediaSpaceWithCreator[]>
}

export const useAssetsStore = create<AssetsStoreState>((set, get) => ({
  assetsBySpace: new Map(),
  
  setAssets: (spaceId: string, assets: MediaSpaceWithCreator[]) => {
    set(state => {
      const newAssetsBySpace = new Map(state.assetsBySpace);
      newAssetsBySpace.set(spaceId, assets);
      return { assetsBySpace: newAssetsBySpace };
    });
  },
  
  fetchAssets: async (spaceId: string, forceRefresh?: boolean) => {
    // Si on a déjà les assets en cache et qu'on ne force pas le rafraîchissement, on les renvoie
    const cachedAssets = get().assetsBySpace.get(spaceId);
    if (cachedAssets && !forceRefresh) {
      return cachedAssets;
    }
    
    try {
      // Récupérer les assets depuis l'API
      const rawAssets: any[] = await basicApiCall('/space/getMedias', { spaceId });
      
      // Traiter les assets
      const processedAssets = rawAssets.map(asset => ({
        ...asset,
        creator: {
          id: asset.uploadedBy || '',
          name: '',
          image: ''
        }
      }));
      
      // Mettre à jour le store
      const sortedAssets = processedAssets.reverse();
      get().setAssets(spaceId, sortedAssets);
      
      return sortedAssets;
    } catch (error) {
      console.error('Erreur lors de la récupération des assets:', error);

      const cachedAssets = get().assetsBySpace.get(spaceId);
      if (cachedAssets) {
        return cachedAssets;
      }

      throw error;
    }
  }
})) 