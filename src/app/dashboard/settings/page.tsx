"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams, useRouter } from "next/navigation"
import { Settings, Building2, Palette } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { SpaceSettingsForm } from "@/src/components/space-settings-form"
import { BrandKitSettings } from "@/src/components/brand-kit-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Separator } from "@/src/components/ui/separator"
import { Button } from "@/src/components/ui/button"

type SettingsTab = "general" | "brand-kit"

export default function SettingsPage() {
  const t = useTranslations('settings')
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")

  // Initialize tab from URL on component mount
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as SettingsTab
    if (tabFromUrl && ["general", "brand-kit"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl)
    }
  }, [searchParams])

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    
    // Update URL with new tab
    const params = new URLSearchParams(searchParams)
    params.set('tab', tab)
    router.push(`/dashboard/settings?${params.toString()}`, { scroll: false })
  }

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
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <SpaceSettingsForm />
     
      case "brand-kit":
        return <BrandKitSettings />
      default:
        return null
    }
  }

  return (
    <div className="flex h-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 border-r bg-muted/40 p-6">
        <div className="space-y-6">
          <div>
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
                  onClick={() => handleTabChange(tab.id)}
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
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl">
          {/* Mobile Header with Tabs */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5" />
              <h1 className="text-xl font-semibold">{t('title')}</h1>
            </div>
            
            <div className="flex gap-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTabChange(tab.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-6">
            <h1 className="text-2xl font-semibold">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
          </div>

          {renderTabContent()}
        </div>
      </div>
    </div>
  )
} 