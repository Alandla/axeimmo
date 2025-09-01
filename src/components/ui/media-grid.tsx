import { IMedia, ISequence } from "@/src/types/video";
import { Loader2, Upload } from "lucide-react";
import { Button } from "./button";
import { useEffect, useState, useRef } from "react";
import { basicApiCall } from "@/src/lib/api";
import MediaItem from "./media-item";
import { FileToUpload } from "@/src/types/files";
import { uploadFiles } from "@/src/service/upload.service";
import { IMediaSpace } from "@/src/types/space";
import { useSession } from "next-auth/react";
import { useMediaToDeleteStore } from "@/src/store/mediaToDelete";
import { useToast } from "@/src/hooks/use-toast";
import { useTranslations } from "next-intl";
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import { PlanName } from "@/src/types/enums";
import { storageLimit } from "@/src/config/plan.config";
import { UsageStorage } from "./usage-storage";
import { useAssetsStore } from "@/src/store/assetsStore";
import { startFalPolling, startLegacyPolling, cleanupPolling } from '@/src/utils/asset-polling';
import GeneratingMediaItem from './generating-media-item';

interface MediaGridProps {
  spaceId: string;
  mediaUsage: 'media' | 'element';
  showUpload?: boolean;
  showStorage?: boolean;
  // Props pour le mode sequence (MediaItem)
  sequence?: ISequence;
  sequenceIndex?: number;
  setSequenceMedia?: (sequenceIndex: number, media: IMedia) => void;
  // Props pour le mode selection (AssetCard)
  onMediaSelect?: (media: IMedia) => void;
  selectedMedia?: IMedia | null;
}

export default function MediaGrid({ 
  spaceId, 
  mediaUsage, 
  showUpload = true, 
  showStorage = true,
  sequence,
  sequenceIndex,
  setSequenceMedia,
  onMediaSelect,
  selectedMedia
}: MediaGridProps) {
  const { data: session } = useSession()
  const t = useTranslations(mediaUsage === 'element' ? 'edit.elements' : 'edit.sequence-edit-assets')
  const { assetsBySpace, fetchAssets: fetchAssetsFromStore, setAssets: setAssetsInStore } = useAssetsStore()

  const [assets, setAssets] = useState<IMediaSpace[]>([])
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const { setSpaceId } = useMediaToDeleteStore()
  const { toast } = useToast()
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()

  // Vérifier si l'utilisateur a un plan Pro ou Entreprise
  const hasPlan = activeSpace?.planName === PlanName.PRO || activeSpace?.planName === PlanName.ENTREPRISE
  
  // Calcul de l'utilisation du stockage
  const usedStorage = activeSpace?.usedStorageBytes || 0
  const storageMax = activeSpace?.storageLimit || (activeSpace?.planName ? storageLimit[activeSpace.planName] : storageLimit[PlanName.FREE])
  const storagePercentage = Math.min(Math.round((usedStorage / storageMax) * 100), 100);
  const isStorageFull = storagePercentage >= 100

  // Désactiver le bouton d'upload si l'utilisateur n'a pas de plan ou si le stockage est plein
  const isUploadDisabled = isUploadingFiles || isStorageFull

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const falPollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Vérifier si les assets sont déjà dans le store pour ce spaceId
    const allAssets = assetsBySpace.get(spaceId) || [];
    const filteredAssets = allAssets.filter(asset => asset.media.usage === mediaUsage);
    
    if (filteredAssets.length > 0) {
      setAssets(filteredAssets);
      return;
    }

    // Seulement charger si on n'a pas encore d'assets pour cet usage
    const loadAssets = async () => {
      try {
        const assetsFromApi = await fetchAssetsFromStore(spaceId, false);
        const filteredAssets = assetsFromApi.filter(asset => asset.media.usage === mediaUsage);
        setAssets(filteredAssets);
      } catch (error) {
        console.error('Erreur lors du chargement des assets:', error);
      }
    };

    loadAssets();

    // setSpaceId pour useMediaToDeleteStore doit toujours être appelé lorsque spaceId change.
    setSpaceId(spaceId);
  }, [spaceId, mediaUsage]);

  // Écouter les changements dans le store pour mettre à jour les assets filtrés
  useEffect(() => {
    const allAssets = assetsBySpace.get(spaceId) || [];
    const filteredAssets = allAssets.filter(asset => asset.media.usage === mediaUsage);
    setAssets(filteredAssets);
  }, [assetsBySpace, spaceId, mediaUsage]);

  // Polling pour mises à jour des médias en génération
  useEffect(() => {
    if (!activeSpace?.id) {
      cleanupPolling(pollingIntervalRef, falPollingIntervalRef)
      return
    }

    const assetsCurrent = assetsBySpace.get(spaceId) || []

    const hasLegacyGenerating = assetsCurrent.some(asset =>
      (asset.media.generationStatus === 'generating-video' || asset.media.generationStatus === 'generating-image') &&
      !asset.media.requestId
    )

    const hasFalGenerating = assetsCurrent.some(asset =>
      asset.media.generationStatus === 'generating-video' && asset.media.requestId
    )

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

    if (hasLegacyGenerating) {
      startLegacyPolling(
        spaceId,
        5000,
        fiveMinutesAgo,
        pollingIntervalRef,
        falPollingIntervalRef,
        assetsCurrent,
        setAssets,
        fetchAssetsFromStore
      )
    }

    if (hasFalGenerating) {
      startFalPolling(
        assetsCurrent,
        spaceId,
        falPollingIntervalRef,
        assetsCurrent,
        setAssets
      )
    }

    return () => {
      cleanupPolling(pollingIntervalRef, falPollingIntervalRef)
    }
  }, [activeSpace?.id, assetsBySpace, spaceId])

  const onDeleteMedia = async (media: IMedia) => {
    toast({
      title: t('toast.deleting-file'),
      description: t('toast.deleting-file-description')
    })
    const currentAssets = assetsBySpace.get(spaceId) || [];
    const updatedAssets = currentAssets.filter(asset => asset.media.id !== media.id);
    setAssetsInStore(spaceId, updatedAssets);

    if (activeSpace && activeSpace.id === spaceId) {
      let storageToRemove = 0;
      if (media.type === 'image' && media.image && media.image.size) {
        storageToRemove += media.image.size;
      } else if (media.type === 'video' && media.video && media.video.size) {
        storageToRemove += media.video.size;
      }

      if (storageToRemove > 0) {
        setActiveSpace({
          ...activeSpace,
          usedStorageBytes: Math.max(0, (activeSpace.usedStorageBytes || 0) - storageToRemove)
        });
      }
    }
    
    toast({
      title: t('toast.file-deleted'),
      description: t('toast.file-deleted-description'),
      variant: 'confirm'
    })
  }

  const handleFileUpload = async (newFiles: File[]) => {
    toast({
      title: t('toast.uploading-file'),
      description: t('toast.uploading-file-description')
    })
    try {
      setIsUploadingFiles(true)
      const uploadedFiles: FileToUpload[] = newFiles.map(file => {
          const type = file.type.startsWith('image/') ? "image" : file.type.startsWith('video/') ? "video" : "audio";
          return {
            file,
            type,
            usage: mediaUsage,
          };
      });

      const files: IMedia[] = await uploadFiles(uploadedFiles)

      const medias: IMediaSpace[] = files.map(file => {
        return {
          media: file,
          uploadedBy: session?.user?.id || '',
          uploadedAt: new Date()
        }
      })

      let mediasToAnalyze: IMediaSpace[] = []
      if (medias.length > 0) {
        const { addedMedias, usedStorageBytes } = await basicApiCall('/space/addMedias', {
            spaceId: spaceId,
            medias
        }) as { addedMedias: IMediaSpace[], usedStorageBytes: number }

        mediasToAnalyze = addedMedias.filter(mediaSpace => {
          return !mediaSpace.media.description || 
                 !mediaSpace.media.description[0]?.text;
        });

        // Conserver l'ordre du plus récent au plus ancien
        setAssetsInStore(spaceId, addedMedias.reverse());

        if (activeSpace && activeSpace.id === spaceId) {
          setActiveSpace({
            ...activeSpace,
            usedStorageBytes: usedStorageBytes
          });
        }

        // Si on a un callback de sélection et qu'on a uploadé des fichiers, sélectionner le premier
        if (onMediaSelect && addedMedias.length > 0) {
          onMediaSelect(addedMedias[0].media);
        }
      }
      setIsUploadingFiles(false)
      toast({
        title: t('toast.file-uploaded'),
        description: t('toast.file-uploaded-description'),
        variant: 'confirm'
      })

      if (mediasToAnalyze.length > 0) {
        for (const mediaSpace of mediasToAnalyze) {
          await basicApiCall('/media/analyze', {
            media: mediaSpace,
            spaceId: spaceId
          });
        }
      }
    } catch (error) {
      setIsUploadingFiles(false)
      console.error(error)
      toast({
        title: t('toast.title-error'),
        description: t('toast.deleting-file-error'),
        variant: 'destructive'
      })
    }
  }

  const isSequenceMode = sequence && sequenceIndex !== undefined && setSequenceMedia;

  return (
    <>
      <input
          id={`file-input-${mediaUsage}`}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*"
          onChange={(e) => {
          if (e.target.files) {
              handleFileUpload(Array.from(e.target.files));
          }
          }}
      />
      {showStorage && (
        <div className="mb-2">
          <UsageStorage 
            usedStorageBytes={activeSpace?.usedStorageBytes || 0} 
            planName={activeSpace?.planName || PlanName.FREE} 
            customStorageLimit={activeSpace?.storageLimit}
          />
        </div>
      )}
      {showUpload && (
        <Button className="w-full" disabled={isUploadDisabled} onClick={() => document.getElementById(`file-input-${mediaUsage}`)?.click()}>
          {isUploadingFiles ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {t('upload-file-button')}
        </Button>
      )}
      <div className="mt-4 flex gap-2">
        {(() => {
          // Créer 3 colonnes vides
          const columns = 3;
          const columnWrappers: IMediaSpace[][] = Array.from({ length: columns }, () => []);
          
          // Répartir les assets en round-robin (tour par tour)
          assets.forEach((asset, index) => {
            const columnIndex = index % columns;
            columnWrappers[columnIndex].push(asset);
          });
          
          // Rendre chaque colonne
          return columnWrappers.map((column, columnIndex) => (
            <div key={columnIndex} className="flex-1 flex flex-col gap-2">
              {column.map((asset, index) => {
                if (asset.media.generationStatus === 'generating-video' || asset.media.generationStatus === 'generating-image') {
                  return (
                    <GeneratingMediaItem key={`${asset.id || asset.media.id}-${columnIndex}-${index}`} mediaSpace={asset} />
                  )
                }
                
                // Mode sequence : utiliser MediaItem
                if (isSequenceMode) {
                  return (
                    <MediaItem 
                      key={`${asset.media.id}-${columnIndex}-${index}`} 
                      sequence={sequence} 
                      sequenceIndex={sequenceIndex} 
                      spaceId={spaceId} 
                      media={asset.media} 
                      source='aws' 
                      canRemove={true} 
                      withMargin={false} 
                      setSequenceMedia={setSequenceMedia} 
                      onDeleteMedia={onDeleteMedia} 
                    />
                  )
                }
                
                // Mode sélection : utiliser MediaItem avec séquence factice
                const fakeSequence: ISequence = {
                  text: '',
                  start: 0,
                  end: 0,
                  durationInFrames: 0,
                  words: [],
                  audioIndex: 0
                };
                
                return (
                  <MediaItem 
                    key={`${asset.media.id}-${columnIndex}-${index}`} 
                    sequence={fakeSequence} 
                    sequenceIndex={0} 
                    spaceId={spaceId} 
                    media={asset.media} 
                    source='aws' 
                    canRemove={true} 
                    withMargin={false} 
                    setSequenceMedia={(_, media) => {
                      if (onMediaSelect) {
                        onMediaSelect(media);
                      }
                    }} 
                    onDeleteMedia={onDeleteMedia}
                  />
                )
              })}
            </div>
          ));
        })()}
      </div>
    </>
  )
}
