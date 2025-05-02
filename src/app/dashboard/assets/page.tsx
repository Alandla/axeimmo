'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { basicApiCall } from '@/src/lib/api'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import AssetCard from '@/src/components/asset-card'
import AssetDialog from '@/src/components/asset-dialog'
import { IMediaSpace } from '@/src/types/space'
import VideoCardSkeleton from '@/src/components/video-card-skeleton'
import { ImageOff, Loader2, Upload } from 'lucide-react'
import { IMedia } from '@/src/types/video'
import { useAssetsStore } from '@/src/store/assetsStore'
import { Button } from '@/src/components/ui/button'
import { FileToUpload } from '@/src/types/files'
import { uploadFiles } from '@/src/service/upload.service'
import { useSession } from 'next-auth/react'
import { useToast } from '@/src/hooks/use-toast'

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
  const { data: session } = useSession()
  const { activeSpace } = useActiveSpaceStore()
  const { assetsBySpace, setAssets: setStoreAssets, fetchAssets } = useAssetsStore()
  const { toast } = useToast()
  
  const [assets, setAssets] = useState<MediaSpaceWithCreator[]>([])
  const [selectedAsset, setSelectedAsset] = useState<MediaSpaceWithCreator | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingFiles, setIsUploadingFiles] = useState(false)
  const [uploadingMedias, setUploadingMedias] = useState<UploadingMedia[]>([])

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
      description: t('toast.uploading-file-description')
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

      if (medias.length > 0) {
        const addedMedias: IMediaSpace[] = await basicApiCall('/space/addMedias', {
          spaceId: activeSpace.id,
          medias
        })
        const addedMediasWithCreator: MediaSpaceWithCreator[] = addedMedias.map(media => ({
          ...media,
          creator: {
            id: session?.user?.id || '',
            name: session?.user?.name || '',
            image: session?.user?.image || ''
          }
        }));
        setAssets(addedMediasWithCreator.reverse());
      }
      
      setUploadingMedias([]);
      setIsUploadingFiles(false)
      
      toast({
        title: t('toast.file-uploaded'),
        description: t('toast.file-uploaded-description'),
        variant: 'confirm'
      })
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
    <>
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
      
      {/* Bouton fixé pour desktop, normal pour mobile */}
      <div className="hidden md:block fixed top-4 right-4 z-10">
        <Button 
          disabled={isUploadingFiles || !activeSpace?.id} 
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {isUploadingFiles ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {t('upload-button')}
        </Button>
      </div>
      
      {/* Version mobile: affichage normal en pleine largeur */}
      <div className="md:hidden px-4">
        <Button 
          className="w-full"
          disabled={isUploadingFiles || !activeSpace?.id} 
          onClick={() => document.getElementById('file-input')?.click()}
        >
          {isUploadingFiles ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {t('upload-button')}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
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

      <AssetDialog
        mediaSpace={selectedAsset}
        setMedia={setMedia}
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
        }}
      />
    </>
  )
} 