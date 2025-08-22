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
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { Download, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getSpaceById } from '@/src/service/space.service'
import { useRouter } from 'next/navigation'

const formatCredits = (credits: number): string => {
  return credits % 1 === 0 ? credits.toFixed(0) : credits.toFixed(1)
}

interface ModalConfirmExportProps {
  cost: number
  spaceId: string
  initialCredits?: number
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onExportVideo: () => Promise<string | undefined>
  showWatermark: boolean
}

export default function ModalConfirmExport({
  cost,
  spaceId,
  initialCredits,
  isOpen,
  setIsOpen,
  onExportVideo,
  showWatermark
}: ModalConfirmExportProps) {
  const [isPending, setIsPending] = useState(false)
  const [credits, setCredits] = useState<number | undefined>(initialCredits)
  const t = useTranslations('export-modal')
  const router = useRouter()

  const handleConfirm = async () => {
    setIsPending(true)
    const exportId = await onExportVideo()
    if (exportId) {
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push(`/export/${exportId}`)
    }
    setIsPending(false)
    setIsOpen(false)
  }

  useEffect(() => {
    if (initialCredits !== undefined) {
      setCredits(initialCredits)
    }

    const fetchSpace = async () => {
      try {
        const space = await getSpaceById(spaceId)
        if (space?.credits !== undefined) {
          setCredits(space.credits)
        }
      } catch (error) {
        console.error('Error fetching space credits:', error)
      }
    }

    if (spaceId && isOpen) {
      fetchSpace()
    }
  }, [isOpen, spaceId, initialCredits])

  return (
    <>
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
            </DialogDescription>
            <div className="text-sm text-gray-500 mt-2">
              <p><b>{t('cost')}:</b> {formatCredits(cost)} credits</p>
              <p><b>{t('balance')}:</b> {credits !== undefined ? formatCredits(credits) : '...'} credits</p>
            </div>
            {showWatermark && (
              <Alert 
                variant="destructive" 
                className="cursor-pointer mt-2"
                onClick={() => setIsOpen(false)}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('watermark-warning')}
                </AlertDescription>
              </Alert>
            )}
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
    </>
  )
}