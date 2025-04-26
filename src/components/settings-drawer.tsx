import { useRef, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/src/components/ui/sheet"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { GeneralSettings } from "./general-settings"
import { User } from "next-auth"
import { useTranslations } from "next-intl"

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  user: User
}

export function SettingsDrawer({ open, onClose, user }: SettingsDrawerProps) {
  const t = useTranslations('general-settings')
  const contentRef = useRef<HTMLDivElement>(null)

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
        <ScrollArea className="h-full">
          <div 
            ref={contentRef}
            tabIndex={-1}
            className="mt-6 focus:outline-none"
          >
            <GeneralSettings user={user} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

