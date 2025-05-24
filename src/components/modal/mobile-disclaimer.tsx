'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Button } from "@/src/components/ui/button"
import { useTranslations } from 'next-intl'

interface MobileDisclaimerModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileDisclaimerModal({ isOpen, onClose }: MobileDisclaimerModalProps) {
  const t = useTranslations('edit.mobile-disclaimer')

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose}>{t('close-button')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 