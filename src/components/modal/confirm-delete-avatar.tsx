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
import { useAvatarToDeleteStore } from '@/src/store/avatarToDelete'
import { Avatar } from '@/src/types/avatar'

interface ModalConfirmDeleteAvatarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  handleDeleteAvatar: (avatar: Avatar) => void
}

export default function ModalConfirmDeleteAvatar({
  isOpen,
  setIsOpen,
  handleDeleteAvatar,
}: ModalConfirmDeleteAvatarProps) {
  const t = useTranslations('modals.confirm-delete')
  const [isPending, setIsPending] = useState(false)
  const { avatar } = useAvatarToDeleteStore()

  const handleConfirm = async () => {
    setIsPending(true)
    if (avatar) {
      handleDeleteAvatar(avatar)
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
            {t('description', { name: avatar?.name })}
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
