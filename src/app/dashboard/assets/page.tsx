'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { basicApiCall } from '@/src/lib/api'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import { useUsersStore } from '@/src/store/creatorUserVideo'
import AssetCard from '@/src/components/asset-card'
import AssetDialog from '@/src/components/asset-dialog'
import { IMediaSpace } from '@/src/types/space'

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
  
  const [assets, setAssets] = useState<MediaSpaceWithCreator[]>([])
  const [selectedAsset, setSelectedAsset] = useState<MediaSpaceWithCreator | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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

  useEffect(() => {
    const fetchAssets = async () => {
      if (activeSpace?.id) {
        const rawAssets: IMediaSpace[] = await basicApiCall('/space/getMedias', {
          spaceId: activeSpace.id
        })
        console.log(rawAssets)
        if (rawAssets) {
          const processedAssets = rawAssets.map(asset => ({
            ...asset,
            creator: {
              id: asset.uploadedBy,
              name: '',
              image: ''
            }
          }))
          setAssets(processedAssets.reverse())
        }
      }
    }

    fetchAssets()
  }, [activeSpace?.id])

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4">
        {assets.map((asset) => (
          <AssetCard
            key={asset.media.id}
            spaceId={activeSpace?.id || ''}
            mediaSpace={asset}
            setMedia={setMedia}
            onClick={() => {
              setSelectedAsset(asset)
              setIsDialogOpen(true)
            }}
          />
        ))}
      </div>

      <AssetDialog
        mediaSpace={selectedAsset}
        setMedia={setMedia}
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedAsset(null)
        }}
      />
    </>
  )
} 