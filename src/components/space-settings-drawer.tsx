import { useRef, useEffect, useState } from "react"
import { Sheet, SheetContent } from "@/src/components/ui/sheet"
import { ScrollArea } from "@/src/components/ui/scroll-area"
import { SpaceSettingsForm } from "./space-settings-form"
import { BrandKitSettings } from "./brand-kit-settings"
import { ApiKeyManagement } from "./api-key-management"
import { useTranslations } from "next-intl"
import { Settings, Building2, Palette, Key } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { Separator } from "@/src/components/ui/separator"

interface SpaceSettingsDrawerProps {
  open: boolean
  onClose: () => void
}

type SettingsTab = "general" | "brand-kit" | "api"

export function SpaceSettingsDrawer({ open, onClose }: SpaceSettingsDrawerProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('settings')
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")

  useEffect(() => {
    if (open) {
      contentRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  const tabs = [
    {
      id: "general" as SettingsTab,
      label: t('general.title'),
      description: t('general.description'),
      icon: Building2,
    },
    {
      id: "brand-kit" as SettingsTab,
      label: t('brand-kit.title'),
      description: t('brand-kit.description'),
      icon: Palette,
    },
    {
      id: "api" as SettingsTab,
      label: t('api.title'),
      description: t('api.description'),
      icon: Key,
    },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <SpaceSettingsForm />
      case "brand-kit":
        return <BrandKitSettings onClose={onClose} />
      case "api":
        return <ApiKeyManagement />
      default:
        return null
    }
  }

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
            className="focus:outline-none px-0 sm:px-6 lg:px-0 h-full"
          >
            <div className="flex flex-col lg:flex-row h-full">
              {/* Sidebar desktop uniquement, h-full pour occuper toute la hauteur */}
              <div className="hidden lg:flex flex-col w-64 min-w-64 border-r bg-muted/40 p-2 space-y-4 h-[80vh]">
                <div className="p-2">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    {t('title')}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('subtitle')}
                  </p>
                </div>
                <Separator />
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors",
                          activeTab === tab.id
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium text-sm">{tab.label}</div>
                          <div className="text-xs opacity-70">{tab.description}</div>
                        </div>
                      </button>
                    )
                  })}
                </nav>
              </div>

              {/* Contenu principal */}
              <div className="flex-1 px-6 lg:px-12">
                {/* Tabs horizontaux mobile uniquement */}
                <div className="mb-6 mt-6 lg:hidden">
                  <div className="flex gap-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                            activeTab === tab.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="max-w-4xl mt-6 ">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 