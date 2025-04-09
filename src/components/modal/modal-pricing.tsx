'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import PricingPage from '../pricing-page'
import { ScrollArea } from '../ui/scroll-area'

interface ModalPricingProps {
  title: string
  description: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export default function ModalPricing({
  title,
  description,
  isOpen,
  setIsOpen,
}: ModalPricingProps) {

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={setIsOpen}
    >
      <DialogContent 
        className="max-w-[95vw] sm:max-w-[85vw] h-[95vh] flex flex-col" 
        onEscapeKeyDown={() => setIsOpen(false)}
        onInteractOutside={() => setIsOpen(false)}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-2">
              <PricingPage />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}