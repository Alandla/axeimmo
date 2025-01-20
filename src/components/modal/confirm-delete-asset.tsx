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
import { MediaSpaceWithCreator } from '@/src/app/dashboard/assets/page'

interface ModalConfirmDeleteAssetProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  mediaSpace: MediaSpaceWithCreator | null
  handleDeleteAsset: (mediaSpace: MediaSpaceWithCreator) => void
}

export default function ModalConfirmDeleteAsset({
  isOpen,
  setIsOpen,
  mediaSpace,
  handleDeleteAsset,
}: ModalConfirmDeleteAssetProps) {
  const t = useTranslations('modals.confirm-delete')
  const [isPending, setIsPending] = useState(false)

  const handleConfirm = async () => {
    setIsPending(true)
    if (mediaSpace) {
      handleDeleteAsset(mediaSpace)
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
            {t('description ', { name: mediaSpace?.media.name })}
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