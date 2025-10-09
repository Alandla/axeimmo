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
import { useLookToDeleteStore } from '@/src/store/lookToDelete'
import { AvatarLook } from '@/src/types/avatar'

interface ModalConfirmDeleteLookProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  handleDeleteLook: (look: AvatarLook) => void
}

export default function ModalConfirmDeleteLook({
  isOpen,
  setIsOpen,
  handleDeleteLook,
}: ModalConfirmDeleteLookProps) {
  const t = useTranslations('modals.confirm-delete')
  const [isPending, setIsPending] = useState(false)
  const { look } = useLookToDeleteStore()

  const handleConfirm = async () => {
    setIsPending(true)
    if (look) {
      handleDeleteLook(look)
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
            {t('description', { name: look?.name })}
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
