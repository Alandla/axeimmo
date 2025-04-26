'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { basicApiCall } from '@/src/lib/api'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import AssetCard from '@/src/components/asset-card'
import AssetDialog from '@/src/components/asset-dialog'
import { IMediaSpace } from '@/src/types/space'
import VideoCardSkeleton from '@/src/components/video-card-skeleton'
import { ImageOff } from 'lucide-react'
import { IMedia } from '@/src/types/video'
import { useAssetsStore } from '@/src/store/assetsStore'

interface User {
  id: string
  name?: string
  image?: string
}

export interface MediaSpaceWithCreator extends IMediaSpace {
  creator: User
}

export default function AssetsPage() {
  const t = useTranslations('assets')
  const { activeSpace } = useActiveSpaceStore()
  const { assetsBySpace, setAssets: setStoreAssets, fetchAssets } = useAssetsStore()
  
  const [assets, setAssets] = useState<MediaSpaceWithCreator[]>([])
  const [selectedAsset, setSelectedAsset] = useState<MediaSpaceWithCreator | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => (
            <VideoCardSkeleton key={index} />
          ))
        ) : assets.length === 0 ? (
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