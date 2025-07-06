'use client'

import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'
import { IMediaSpace } from '@/src/types/space'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import ImageToVideoEnhancer from '@/src/components/image-to-video-enhancer'

interface ImageToVideoModalProps {
  mediaSpace: IMediaSpace | null
  open: boolean
  onClose: () => void
  onSuccess: (generatedMediaSpace: IMediaSpace) => void
}

export default function ImageToVideoModal({ 
  mediaSpace, 
  open, 
  onClose, 
  onSuccess 
}: ImageToVideoModalProps) {
  const t = useTranslations('assets')

  const handleSuccess = (result: any) => {
    if (!mediaSpace) return

    // Créer un objet mediaSpace temporaire pour la génération
    const generatingMediaSpace: IMediaSpace = {
      ...mediaSpace,
      id: result.mediaId || `generating-${Date.now()}`,
      media: {
        ...mediaSpace.media,
        generationStatus: 'generating-video',
        requestId: result.requestId
      },
      uploadedAt: new Date()
    }

    onSuccess(generatingMediaSpace)
    onClose()
  }

  if (!mediaSpace) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('image-to-video-modal.title')}
          </DialogTitle>
        </DialogHeader>

        <ImageToVideoEnhancer
          mediaSpace={mediaSpace}
          onBack={onClose}
          onSuccess={handleSuccess}
          isModal={true}
        />
      </DialogContent>
    </Dialog>
  )
} 