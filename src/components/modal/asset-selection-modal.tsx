'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import { useAssetsStore } from '@/src/store/assetsStore'
import AssetCard from '../asset-card'
import { IMediaSpace } from '@/src/types/space'
import VideoCardSkeleton from '../video-card-skeleton'
import { ImageOff } from 'lucide-react'
import { AssetToUpload } from '@/src/types/files'
import { useAssetFilters } from '../asset-filters'
import { useAssetFiltersStore } from '@/src/store/assetFiltersStore'

interface AssetSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedAssets: AssetToUpload[]) => void
  excludeUsage?: string[]
}

export function AssetSelectionModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  excludeUsage = ['element'] 
}: AssetSelectionModalProps) {
  const t = useTranslations('asset-selection')
  const { activeSpace } = useActiveSpaceStore()
  const { assetsBySpace, fetchAssets } = useAssetsStore()
  
  const [assets, setAssets] = useState<IMediaSpace[]>([])
  const [selectedAssets, setSelectedAssets] = useState<IMediaSpace[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtrer les assets pour exclure ceux en génération et les usages spécifiés
  const baseFilteredAssets = assets.filter(asset => 
    asset.media.generationStatus === 'completed' && 
    !excludeUsage.includes(asset.media.usage)
  )

  // Utiliser les filtres avec les assets de base filtrés
  const availableAssets = baseFilteredAssets

  useEffect(() => {
    if (!isOpen || !activeSpace?.id) return

    const loadAssets = async () => {
      try {
        setIsLoading(true)
        const cachedAssets = assetsBySpace.get(activeSpace.id)
        
        if (cachedAssets) {
          setAssets(cachedAssets)
          setIsLoading(false)
        }

        const assetsFromApi = await fetchAssets(activeSpace.id, true)
        setAssets(assetsFromApi)
        setIsLoading(false)
      } catch (error) {
        console.error('Erreur lors du chargement des assets:', error)
        setIsLoading(false)
      }
    }

    loadAssets()
  }, [isOpen, activeSpace?.id])

  const handleAssetToggle = (asset: IMediaSpace) => {
    setSelectedAssets(prev => {
      const isSelected = prev.find(a => a.media.id === asset.media.id)
      if (isSelected) {
        return prev.filter(a => a.media.id !== asset.media.id)
      } else {
        return [...prev, asset]
      }
    })
  }

  const handleConfirm = () => {
    const assetsToUpload: AssetToUpload[] = selectedAssets.map(asset => ({
      media: asset.media,
      type: asset.media.type,
      usage: "media" // Usage par défaut, peut être changé après
    }))
    
    onConfirm(assetsToUpload)
    setSelectedAssets([])
    onClose()
  }

  const handleClose = () => {
    setSelectedAssets([])
    onClose()
  }

  const handleCancel = () => {
    setSelectedAssets([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleCancel();
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <VideoCardSkeleton key={index} hideActionButton={true} />
              ))}
            </div>
          ) : availableAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ImageOff className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('no-assets')}</h3>
              <p className="text-gray-500 text-center">{t('no-assets-description')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availableAssets.map((asset) => (
                <AssetCard
                  key={asset.media.id}
                  spaceId={activeSpace?.id || ''}
                  mediaSpace={asset}
                  setMedia={() => {}} // Pas de modification dans ce contexte
                  onClick={() => handleAssetToggle(asset)}
                  isSelected={selectedAssets.some(a => a.media.id === asset.media.id)}
                  selectionMode={true}
                />
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedAssets.length === 0}
          >
            {t('confirm')} ({selectedAssets.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
