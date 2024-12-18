'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import { SimpleSpace } from '@/src/types/space'
import { getSpaceById } from '@/src/service/space.service'

interface ModalConfirmExportProps {
  cost: number
  spaceId: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onExportVideo: () => Promise<string | undefined>
}

export default function ModalConfirmExport({
  cost,
  spaceId,
  isOpen,
  setIsOpen,
  onExportVideo
}: ModalConfirmExportProps) {
  const [isPending, setIsPending] = useState(false)
  const [space, setSpace] = useState<SimpleSpace | null>(null)
  const t = useTranslations('export-modal')

  const handleConfirm = async () => {
    setIsPending(true)
    const exportId = await onExportVideo()
    if (exportId) {
      window.open(`/export/${exportId}`, '_blank')
    }
    setIsPending(false)
    setIsOpen(false)
  }

  useEffect(() => {
    const fetchSpace = async () => {
      const space = await getSpaceById(spaceId)
      setSpace(space)
    }
    if (spaceId && (!space || isOpen)) {
      fetchSpace()
    }
  }, [isOpen])

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={setIsOpen}
    >
      <DialogContent 
        className="sm:max-w-[425px]" 
        onEscapeKeyDown={() => setIsOpen(false)}
        onInteractOutside={() => setIsOpen(false)}
      >
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
            <div className="text-sm text-gray-500 mt-2">
              <p><b>{t('cost')}:</b> {cost} credits</p>
              <p><b>{t('balance')}:</b> {space?.credits} credits</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            {t('cancel-button')}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
          >
            <Download className="w-4 h-4" />
            {isPending ? t('saving') : t('export-button')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}