'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { basicApiCall } from '@/src/lib/api'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import AssetCard from '@/src/components/asset-card'
import AssetDialog from '@/src/components/asset-dialog'
import { IMediaSpace } from '@/src/types/space'
import VideoCardSkeleton from '@/src/components/video-card-skeleton'
import { ImageOff, AlertTriangle, Loader2, Upload } from 'lucide-react'
import { IMedia } from '@/src/types/video'
import { useAssetsStore } from '@/src/store/assetsStore'
import { Button } from '@/src/components/ui/button'
import { FileToUpload } from '@/src/types/files'
import { uploadFiles } from '@/src/service/upload.service'
import { useSession } from 'next-auth/react'
import { useToast } from '@/src/hooks/use-toast'
import AssetUpgradeBanner from '@/src/components/asset-upgrade-banner'
import { PlanName } from '@/src/types/enums'
import { storageLimit } from '@/src/config/plan.config'
import { formatBytes } from '@/src/utils/format'
import { Alert, AlertDescription, AlertTitle } from '@/src/components/ui/alert'
import { UsageStorage } from '@/src/components/ui/usage-storage'

interface User {
  id: string
  name?: string
  image?: string
}

export interface MediaSpaceWithCreator extends IMediaSpace {
  creator: User
}

export interface UploadingMedia {
  id: string
  isUploading: boolean
  file: File
}

export default function AssetsPage() {
  const t = useTranslations('assets')
  const tDashboard = useTranslations('dashboard')
  const { data: session } = useSession()
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()
  const { assetsBySpace, setAssets: setStoreAssets, fetchAssets } = useAssetsStore()
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [assets, setAssets] = useState<MediaSpaceWithCreator[]>([])
  const [selectedAsset, setSelectedAsset] = useState<MediaSpaceWithCreator | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [uploadingMedias, setUploadingMedias] = useState<UploadingMedia[]>([])
  const [containerHeight, setContainerHeight] = useState(0)

  // Vérifier si l'utilisateur a un plan Pro ou Entreprise
  const hasPlan = activeSpace?.planName === PlanName.PRO || activeSpace?.planName === PlanName.ENTREPRISE
  
  // Calcul de l'utilisation du stockage
  const usedStorage = activeSpace?.usedStorageBytes || 0
  const storageMax = activeSpace?.storageLimit || storageLimit[activeSpace?.planName || PlanName.FREE]
  const storagePercentage = Math.min(Math.round((usedStorage / storageMax) * 100), 100);
  const isStorageFull = storagePercentage >= 100
  const isStorageWarning = storagePercentage > 70
  const isStorageCritical = storagePercentage > 90

  // Désactiver le bouton d'upload si l'utilisateur n'a pas de plan ou si le stockage est plein
  const isUploadDisabled = !activeSpace?.id || isUploadingFiles || !hasPlan || isStorageFull

  // Mettre à jour la hauteur du conteneur
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateHeight = () => {
        // Soustraire la hauteur du header (64px = 16 * 4, h-16 dans le layout)
        setContainerHeight(window.innerHeight - 64);
      };
      
      updateHeight();
      window.addEventListener('resize', updateHeight);
      
      return () => {
        window.removeEventListener('resize', updateHeight);
      };
    }
  }, []);

  const setMedia = (media: MediaSpaceWithCreator) => {
    setAssets(prevAssets => {
      const assetIndex = prevAssets.findIndex(a => a.id === media.id)
      if (assetIndex === -1) return prevAssets
      
      const newAssets = [...prevAssets]
      newAssets[assetIndex] = media
      return newAssets
    })
    setSelectedAsset(media)
  }

  const handleDeleteAsset = (deletedMedia: IMedia) => {
    const updatedAssets = assets.filter(asset => asset.media.id !== deletedMedia.id);
    setAssets(updatedAssets);
    
    if (activeSpace?.id) {
      setStoreAssets(activeSpace.id, updatedAssets);
    }
  };

  const handleFileUpload = async (newFiles: File[]) => {
    if (!activeSpace?.id) return;
    
    toast({
      title: t('toast.uploading-file'),
      description: t('toast.uploading-file-description'),
      variant: 'loading'
    })

    try {
      setIsUploadingFiles(true)
      
      // Créer des médias temporaires pour l'affichage du chargement
      const tempUploadingMedias = newFiles.map(file => ({
        id: `temp-${Math.random().toString(36).substring(2, 9)}`,
        isUploading: true,
        file
      }));
      
      setUploadingMedias(tempUploadingMedias);
      
      const uploadedFiles: FileToUpload[] = newFiles.map(file => {
        const type = file.type.startsWith('image/') ? "image" : file.type.startsWith('video/') ? "video" : "audio";
        return {
          file,
          type,
          usage: "media",
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
          spaceId: activeSpace.id,
          medias
        }) as { addedMedias: IMediaSpace[], usedStorageBytes: number }
        const addedMediasWithCreator: MediaSpaceWithCreator[] = addedMedias.map(media => ({
          ...media,
          creator: {
            id: session?.user?.id || '',
            name: session?.user?.name || '',
            image: session?.user?.image || ''
          }
        }));
        setAssets(addedMediasWithCreator.reverse());

        if (activeSpace) {
          setActiveSpace({
            ...activeSpace,
            usedStorageBytes: usedStorageBytes
          });
        }

        mediasToAnalyze = addedMedias.filter(mediaSpace => {
          return !mediaSpace.media.description || mediaSpace.media.description[0].text === "";
        });
      }
      
      setUploadingMedias([]);
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
            spaceId: activeSpace.id
          });
        }
      }
    } catch (error) {
      setUploadingMedias([]);
      setIsUploadingFiles(false)
      console.error(error)
      toast({
        title: t('toast.title-error'),
        description: t('toast.uploading-file-error'),
        variant: 'destructive'
      })
    }
  };

  useEffect(() => {
    if (!activeSpace?.id) return;

    const cachedAssets = assetsBySpace.get(activeSpace.id);
    
    if (cachedAssets) {
      setAssets(cachedAssets);
      setIsLoading(false);
    }

    const loadAssets = async () => {
      try {
        if (!cachedAssets) {
          setIsLoading(true);
        }

        const assetsFromApi = await fetchAssets(activeSpace.id, true);

        setAssets(assetsFromApi);
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des assets:', error);
        if (!cachedAssets) {
          setIsLoading(false);
        }
      }
    };
    
    loadAssets();
  }, [activeSpace]);

  return (
    <div className="relative">
      {/* Version desktop: barre de progression et bouton côte à côte */}
      <div 
        className={`hidden md:flex items-center justify-end space-x-4 fixed top-4 right-4 z-50 ${activeSpace && !hasPlan ? 'filter blur-sm pointer-events-none' : ''}`} 
        style={{ position: 'fixed', top: '1rem', right: '1rem' }}
      >
        <div className="w-64">
          <UsageStorage 
            usedStorageBytes={activeSpace?.usedStorageBytes || 0} 
            planName={activeSpace?.planName || PlanName.FREE} 
            customStorageLimit={activeSpace?.storageLimit}
          />
        </div>
        <Button 
          disabled={isUploadDisabled}
          onClick={() => document.getElementById('file-input')?.click()}
          className="relative z-50"
        >
          {isUploadingFiles ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {t('upload-button')}
        </Button>
      </div>
    
      <div 
        ref={containerRef} 
        className="relative"
        style={{ height: !hasPlan ? `${containerHeight}px` : 'auto' }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(Array.from(e.target.files));
            }
          }}
        />
        
        {/* Alerte de stockage */}
        {activeSpace && isStorageWarning && (
          <div className="px-4 py-2 mb-4">
            <Alert variant={isStorageCritical ? "destructive" : "warning"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {isStorageCritical 
                  ? tDashboard('storage-limit-exceeded') 
                  : tDashboard('storage-limit-warning')
                }
              </AlertTitle>
              <AlertDescription>
                {formatBytes(usedStorage)} / {formatBytes(storageMax)} ({storagePercentage}%)
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {/* Bannière d'upgrade pour les utilisateurs sans plan Pro ou Entreprise */}
        {activeSpace && !hasPlan && (
          <div 
            className="absolute inset-x-0 bottom-0 top-16 z-10 flex items-center justify-center p-4 overflow-visible"
            style={{ top: '16px' }}
          >
            <div className="w-full max-w-6xl">
              <AssetUpgradeBanner />
            </div>
          </div>
        )}
        
        <div 
          className={activeSpace && !hasPlan ? "filter blur-sm pointer-events-none overflow-hidden" : ""}
          style={{ maxHeight: activeSpace && !hasPlan ? `${containerHeight}px` : 'none' }}
        >
          {/* Version mobile: barre de progression au-dessus + bouton pleine largeur */}
          <div className="md:hidden px-4 mb-4">
            <div className="mb-2">
              <UsageStorage 
                usedStorageBytes={activeSpace?.usedStorageBytes || 0} 
                planName={activeSpace?.planName || PlanName.FREE} 
                customStorageLimit={activeSpace?.storageLimit}
              />
            </div>
            <Button 
              className="w-full"
              disabled={isUploadDisabled}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              {isUploadingFiles ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {t('upload-button')}
            </Button>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {/* Afficher les médias en cours d'upload */}
              {uploadingMedias.map((uploadingMedia) => (
                <div key={uploadingMedia.id} className="relative overflow-hidden rounded-lg">
                  <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                  <div className="p-2">
                    <p className="text-lg font-semibold truncate cursor-text">{uploadingMedia.file.name}</p>
                    <p className="text-sm text-gray-500 truncate">{t('uploading')}...</p>
                  </div>
                </div>
              ))}
              
              {isLoading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <VideoCardSkeleton key={index} />
                ))
              ) : assets.length === 0 && uploadingMedias.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20">
                  <ImageOff className="w-12 h-12 text-gray-400 mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">{t('no-assets')}</h2>
                  <p className="text-gray-500 mb-6 text-center">
                    {t('no-assets-description')}
                  </p>
                </div>
              ) : (
                assets.map((asset) => (
                  <AssetCard
                    key={asset.media.id}
                    spaceId={activeSpace?.id || ''}
                    mediaSpace={asset}
                    setMedia={setMedia}
                    onDelete={handleDeleteAsset}
                    onClick={() => {
                      setSelectedAsset(asset)
                      setIsDialogOpen(true)
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AssetDialog
        mediaSpace={selectedAsset}
        setMedia={setMedia}
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
        }}
      />
    </div>
  )
} 