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
          <DialogTitle>Confirm deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {video?.title} ? This action is irreversible.
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