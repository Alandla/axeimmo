'use client'

import { useState } from 'react'
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

interface ModalConfirmExportProps {
  cost: number
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onExportVideo: () => Promise<string | undefined>
}

export default function ModalConfirmExport({
  cost,
  isOpen,
  setIsOpen,
  onExportVideo
}: ModalConfirmExportProps) {
  const [isPending, setIsPending] = useState(false)

  const handleConfirm = async () => {
    setIsPending(true)
    const exportId = await onExportVideo()
    if (exportId) {
      window.open(`/export/${exportId}`, '_blank')
    }
    setIsPending(false)
    setIsOpen(false)
  }

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
          <DialogTitle>Export the video ?</DialogTitle>
          <DialogDescription>
            Exporting this video will cost you credits as follows, please confirm.
            <div className="text-sm text-gray-500 mt-2">
              <p><b>Cost:</b> {cost} credits</p>
              <p><b>Balance:</b> 50 credits</p>
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
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
          >
            <Download className="w-4 h-4" />
            {isPending ? 'Saving...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}