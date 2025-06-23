import { create } from 'zustand'
import { IMediaSpace } from '../types/space'
import { basicApiCall } from '../lib/api'

interface AssetsStoreState {
  assetsBySpace: Map<string, IMediaSpace[]>
  setAssets: (spaceId: string, assets: IMediaSpace[]) => void
  fetchAssets: (spaceId: string, forceRefresh?: boolean) => Promise<IMediaSpace[]>
  clearSpaceCache: (spaceId: string) => void
}

export const useAssetsStore = create<AssetsStoreState>((set, get) => ({
  assetsBySpace: new Map(),
  
  setAssets: (spaceId: string, assets: IMediaSpace[]) => {
    set(state => {
      const newAssetsBySpace = new Map(state.assetsBySpace);
      newAssetsBySpace.set(spaceId, assets);
      return { assetsBySpace: newAssetsBySpace };
    });
  },
  
  fetchAssets: async (spaceId: string, forceRefresh: boolean = false) => {
    const state = get();
    const cachedAssets = state.assetsBySpace.get(spaceId);
    
    if (!forceRefresh && cachedAssets) {
      return cachedAssets;
    }
    
    try {
      const rawAssets: IMediaSpace[] = await basicApiCall('/space/getMedias', { spaceId });
      
      get().setAssets(spaceId, rawAssets);
      return rawAssets;
    } catch (error) {
      console.error('Erreur lors de la récupération des assets:', error);
      
      if (cachedAssets) {
        return cachedAssets;
      }
      
      throw error;
    }
  },
  
  clearSpaceCache: (spaceId: string) => {
    set(state => {
      const newAssetsBySpace = new Map(state.assetsBySpace);
      newAssetsBySpace.delete(spaceId);
      return { assetsBySpace: newAssetsBySpace };
    });
  }
})) 