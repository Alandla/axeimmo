import { useRef, useEffect } from "react"
import { Sheet, SheetContent } from "@/src/components/ui/sheet"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { GeneralSettings } from "./general-settings"
import { User } from "next-auth"
import { useTranslations } from "next-intl"
import { Settings } from "lucide-react"

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
        <ScrollArea className="h-full">
          <div 
            ref={contentRef}
            tabIndex={-1}
            className="focus:outline-none px-6 lg:px-12 h-full"
          >
            <div className="mb-6 mt-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('title')}
              </h2>
            </div>
            <div className="max-w-4xl">
              <GeneralSettings user={user} />
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

