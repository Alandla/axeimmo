import { useRef, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/src/components/ui/sheet"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { SpaceSettingsForm } from "./space-settings-form"
import { useTranslations } from "next-intl"

interface SpaceSettingsDrawerProps {
  open: boolean
  onClose: () => void
}

export function SpaceSettingsDrawer({ open, onClose }: SpaceSettingsDrawerProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('settings.space')

  useEffect(() => {
    if (open) {
      // Set focus to the content div, but don't show outline
      contentRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[80vh] p-0 focus:outline-none rounded-t-lg"
      >
        <SheetHeader className="p-6 pb-0 sm:px-12">
          <SheetTitle>{t('title')}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-grow">
          <div 
            ref={contentRef}
            tabIndex={-1}
            className="mt-6 focus:outline-none"
          >
            <SpaceSettingsForm />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 