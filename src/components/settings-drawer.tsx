import { useRef, useEffect } from "react"
import { Sheet, SheetContent } from "@/src/components/ui/sheet"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { GeneralSettings } from "./general-settings"
import { User } from "next-auth"

interface SettingsDrawerProps {
  open: boolean
  onClose: () => void
  user: User
}

export function SettingsDrawer({ open, onClose, user }: SettingsDrawerProps) {
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
            className="p-6 focus:outline-none"
          >
            <GeneralSettings user={user} />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

