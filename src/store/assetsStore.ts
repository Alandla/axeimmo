import { create } from 'zustand'
import { IMediaSpace } from '../types/space'
import { MediaSpaceWithCreator } from '@/src/app/dashboard/assets/page'
import { basicApiCall } from '@/src/lib/api'

interface AssetsStoreState {
  // Stockage des assets par spaceId
  assetsBySpace: Map<string, MediaSpaceWithCreator[]>
  
  // Fonction pour définir les assets d'un espace
  setAssets: (spaceId: string, assets: IMediaSpace[]) => void
  
  // Fonction pour récupérer les assets d'un espace
  fetchAssets: (spaceId: string, forceRefresh?: boolean) => Promise<MediaSpaceWithCreator[]>
}

export const useAssetsStore = create<AssetsStoreState>((set, get) => ({
  assetsBySpace: new Map(),
  
  setAssets: (spaceId: string, newAssets: IMediaSpace[]) => {
    set(state => {
      const newAssetsBySpace = new Map(state.assetsBySpace);
      const processedAssets = newAssets.map(asset => {
        // Si c'est déjà un MediaSpaceWithCreator (vérification souple), on le garde tel quel.
        // Sinon, on transforme IMediaSpace en MediaSpaceWithCreator.
        if ('creator' in asset && typeof asset.creator === 'object' && asset.creator !== null && 'id' in asset.creator) {
          return asset as MediaSpaceWithCreator;
        }
        return {
          ...asset,
          creator: {
            id: asset.uploadedBy || '', 
            name: '', 
            image: '',
          },
        };
      });
      newAssetsBySpace.set(spaceId, processedAssets.reverse()); // Transformation et inversion ici
      return { assetsBySpace: newAssetsBySpace };
    });
  },
  
  fetchAssets: async (spaceId: string, forceRefresh?: boolean) => {
    const cachedAssets = get().assetsBySpace.get(spaceId);
    if (cachedAssets && !forceRefresh) {
      return cachedAssets;
    }
    
    try {
      const rawAssets: IMediaSpace[] = await basicApiCall('/space/getMedias', { spaceId });
      
      // Appeler setAssets qui gère la transformation et l'inversion
      get().setAssets(spaceId, rawAssets);
      
      // Retourner les assets traités depuis le store
      return get().assetsBySpace.get(spaceId) || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des assets:', error);

      // En cas d'erreur, retourner les assets mis en cache s'ils existent
      const existingCachedAssets = get().assetsBySpace.get(spaceId);
      if (existingCachedAssets) {
        return existingCachedAssets;
      }

      throw error;
    }
  }
})) 