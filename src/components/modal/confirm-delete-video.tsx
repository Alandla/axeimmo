'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { useVideoToDeleteStore } from '@/src/store/videoToDelete'
import { IVideo } from '@/src/types/video'

interface ModalConfirmDeleteProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  handleDeleteVideo: (video: IVideo) => void
}

export default function ModalConfirmDelete({
  isOpen,
  setIsOpen,
  handleDeleteVideo,
}: ModalConfirmDeleteProps) {
  const t = useTranslations('modals.confirm-delete')
  const [isPending, setIsPending] = useState(false)
  const { video } = useVideoToDeleteStore()

  const handleConfirm = async () => {
    setIsPending(true)
    if (video) {
      handleDeleteVideo(video)
    }
    setIsPending(false)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent 
        className="sm:max-w-[425px]"
      >
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description', { name: video?.title })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? t('deleting') : t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}