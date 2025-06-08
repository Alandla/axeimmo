import { basicApiCall } from '@/src/lib/api';
import { MediaSpaceWithCreator } from '@/src/app/dashboard/assets/page';

// Type pour la fonction setAssets qui peut accepter deux signatures différentes
type SetAssetsFunction = 
  | ((assets: MediaSpaceWithCreator[]) => void)
  | ((updater: (prevAssets: MediaSpaceWithCreator[]) => MediaSpaceWithCreator[]) => void);

/**
 * Vérifie l'état des médias avec requestId (Fal.ai)
 */
export const checkFalMedias = async (
  currentAssets: MediaSpaceWithCreator[], 
  spaceId: string,
  setAssets?: (assets: MediaSpaceWithCreator[]) => void
): Promise<MediaSpaceWithCreator[]> => {
  const mediasToCheck = currentAssets.filter(asset => 
    asset.media.generationStatus === 'generating-video' && 
    asset.media.requestId
  );

  if (mediasToCheck.length === 0) {
    return [];
  }

  console.log(`Checking ${mediasToCheck.length} Fal.ai request(s) for video generation`);

  // Vérifier chaque media en parallèle
  const checkPromises = mediasToCheck.map(async (mediaSpace) => {
    try {
      const result = await basicApiCall('/media/check-generation', {
        mediaSpace,
        spaceId
      }) as { status: string; mediaSpace?: MediaSpaceWithCreator };

      if (result.status === 'completed' || result.status === 'failed') {
        return result.mediaSpace; // MediaSpace mis à jour
      }
      return null; // Toujours en cours
    } catch (error) {
      console.error(`Error checking media ${mediaSpace.id}:`, error);
      return null;
    }
  });

  const results = await Promise.all(checkPromises);
  return results.filter((result): result is MediaSpaceWithCreator => result !== null && result !== undefined);
};

/**
 * Met à jour les assets avec les médias mis à jour
 */
export const updateAssetsWithCompletedMedias = (
  updatedMedias: MediaSpaceWithCreator[],
  setAssets: SetAssetsFunction
) => {
  if (updatedMedias.length === 0) return;

  // Conversion sûre car nous savons comment nous utilisons cette fonction
  const setAssetsFn = setAssets as (updater: (prevAssets: MediaSpaceWithCreator[]) => MediaSpaceWithCreator[]) => void;
  
  setAssetsFn(prevAssets => {
    const newAssets = [...prevAssets];
    updatedMedias.forEach((updatedMedia) => {
      const index = newAssets.findIndex(asset => asset.id === updatedMedia.id);
      if (index !== -1) {
        newAssets[index] = updatedMedia;
      }
    });
    return newAssets;
  });

  console.log(`Updated ${updatedMedias.length} completed media(s)`);
};

/**
 * Démarre le polling Fal.ai pour les médias avec requestId
 */
export const startFalPolling = (
  initialAssets: MediaSpaceWithCreator[], 
  spaceId: string,
  falPollingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  assets: MediaSpaceWithCreator[],
  setAssets: SetAssetsFunction
) => {
  if (falPollingIntervalRef.current) return;

  console.log('Starting Fal.ai polling');
  
  falPollingIntervalRef.current = setInterval(async () => {
    try {
      const currentAssets = assets.length > 0 ? assets : initialAssets;
      
      // Vérifier l'état des médias avec requestId
      const updatedMedias = await checkFalMedias(currentAssets, spaceId);
      
      // Mettre à jour les assets avec les médias terminés
      updateAssetsWithCompletedMedias(updatedMedias, setAssets);

      // Vérifier s'il reste des médias en génération
      const stillGenerating = currentAssets.some(asset => 
        asset.media.generationStatus === 'generating-video' && 
        asset.media.requestId &&
        !updatedMedias.some((updated) => updated.id === asset.id)
      );

      if (!stillGenerating && falPollingIntervalRef.current) {
        console.log('All Fal.ai requests completed, stopping polling');
        clearInterval(falPollingIntervalRef.current);
        falPollingIntervalRef.current = null;
      }
    } catch (error) {
      console.error('Error during Fal.ai polling:', error);
    }
  }, 10000); // Vérifier toutes les 10 secondes pour Fal.ai
};

/**
 * Démarre le polling des médias sans requestId (ancienne logique)
 */
export const startLegacyPolling = (
  initialAssets: MediaSpaceWithCreator[], 
  spaceId: string, 
  pollInterval: number,
  fiveMinutesAgo: Date,
  pollingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  falPollingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  assets: MediaSpaceWithCreator[],
  setAssets: SetAssetsFunction,
  fetchAssets: (spaceId: string, withCreator?: boolean) => Promise<MediaSpaceWithCreator[]>
) => {
  if (pollingIntervalRef.current) return;

  console.log('Starting legacy polling');
  
  pollingIntervalRef.current = setInterval(async () => {
    try {
      // Récupérer les derniers assets
      const updatedAssets = await fetchAssets(spaceId, true);
      
      // Type cast sûr car nous connaissons l'utilisation
      const setAssetsFn = setAssets as (assets: MediaSpaceWithCreator[]) => void;
      setAssetsFn(updatedAssets);
      
      // Vérifier s'il reste des médias en génération sans requestId
      const stillGenerating = updatedAssets.some(asset => 
        (asset.media.generationStatus === 'generating-video' || asset.media.generationStatus === 'generating-image') &&
        !asset.media.requestId &&
        new Date(asset.uploadedAt) > fiveMinutesAgo
      );
      
      // Vérifier s'il y a des médias qui ont obtenu un requestId
      if (!falPollingIntervalRef.current) {
        const mediasWithRequestId = updatedAssets.filter(asset => 
          asset.media.generationStatus === 'generating-video' && 
          asset.media.requestId
        );
        
        if (mediasWithRequestId.length > 0) {
          console.log(`Detected ${mediasWithRequestId.length} media(s) with requestId during regular polling`);
          startFalPolling(updatedAssets, spaceId, falPollingIntervalRef, assets, setAssets);
        }
      }
      
      // Arrêter le polling si plus de médias en génération sans requestId
      if (!stillGenerating && pollingIntervalRef.current) {
        console.log('No more legacy media generating, stopping polling');
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } catch (error) {
      console.error('Error during legacy polling:', error);
    }
  }, pollInterval);
};

/**
 * Initialise les pollings en fonction des assets
 */
export const initPolling = (
  assets: MediaSpaceWithCreator[], 
  spaceId: string,
  pollingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  falPollingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  currentAssets: MediaSpaceWithCreator[],
  setAssets: SetAssetsFunction,
  fetchAssets: (spaceId: string, withCreator?: boolean) => Promise<MediaSpaceWithCreator[]>
) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  // 1. Vérifier les médias sans requestId (ancienne logique)
  const recentGeneratingAssets = assets.filter(asset => 
    (asset.media.generationStatus === 'generating-video' || asset.media.generationStatus === 'generating-image') &&
    !asset.media.requestId &&
    new Date(asset.uploadedAt) > fiveMinutesAgo
  );
  
  if (recentGeneratingAssets.length > 0) {
    const hasVideoGeneration = recentGeneratingAssets.some(asset => asset.media.generationStatus === 'generating-video');
    const hasImageGeneration = recentGeneratingAssets.some(asset => asset.media.generationStatus === 'generating-image');
    
    const pollInterval = hasImageGeneration ? 1000 : 5000; // 1s pour images, 5s pour vidéos
    startLegacyPolling(
      assets, 
      spaceId, 
      pollInterval, 
      fiveMinutesAgo, 
      pollingIntervalRef, 
      falPollingIntervalRef, 
      currentAssets,
      setAssets,
      fetchAssets
    );
  } else if (pollingIntervalRef.current) {
    clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = null;
  }
  
  // 2. Vérifier les médias avec requestId (Fal.ai)
  const mediaWithRequestId = assets.filter(asset => 
    asset.media.generationStatus === 'generating-video' && 
    asset.media.requestId
  );
  
  if (mediaWithRequestId.length > 0) {
    startFalPolling(assets, spaceId, falPollingIntervalRef, currentAssets, setAssets);
  } else if (falPollingIntervalRef.current) {
    clearInterval(falPollingIntervalRef.current);
    falPollingIntervalRef.current = null;
  }
};

/**
 * Nettoie les intervalles de polling
 */
export const cleanupPolling = (
  pollingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>,
  falPollingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  if (pollingIntervalRef.current) {
    clearInterval(pollingIntervalRef.current);
    pollingIntervalRef.current = null;
  }
  if (falPollingIntervalRef.current) {
    clearInterval(falPollingIntervalRef.current);
    falPollingIntervalRef.current = null;
  }
}; 