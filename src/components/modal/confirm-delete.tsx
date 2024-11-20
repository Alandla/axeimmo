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
import { basicApiCall } from '@/src/lib/api'
import { useMediaToDeleteStore } from '@/src/store/mediaToDelete'

interface ModalConfirmDeleteProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onDeleteMedia: (mediaId: string) => void
}

export default function ModalConfirmDelete({
  isOpen,
  setIsOpen,
  onDeleteMedia = () => {}
}: ModalConfirmDeleteProps) {
  const [isPending, setIsPending] = useState(false)
  const { media, spaceId } = useMediaToDeleteStore()

  const handleConfirm = async () => {
    setIsPending(true)
    await basicApiCall('/media/delete', {
        media,
        spaceId
    })
    onDeleteMedia(media?.id || '')
    setIsPending(false)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {media?.name} ? This action is irreversible.
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
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}