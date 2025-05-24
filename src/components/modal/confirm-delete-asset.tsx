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
import { IMedia } from '@/src/types/video'

interface ModalConfirmDeleteAssetProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  media: IMedia | null
  handleDeleteAsset: (media: IMedia) => Promise<void>
}

export default function ModalConfirmDeleteAsset({
  isOpen,
  setIsOpen,
  media,
  handleDeleteAsset,
}: ModalConfirmDeleteAssetProps) {
  const t = useTranslations('modals.confirm-delete')
  const [isPending, setIsPending] = useState(false)

  const handleConfirm = async () => {
    setIsPending(true)
    if (media) {
      await handleDeleteAsset(media)
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
            {t('description', { name: media?.name })}
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