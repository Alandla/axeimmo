"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Settings, Building2, Users, CreditCard, Palette, Mic } from "lucide-react"
import { cn } from "@/src/lib/utils"
import { SpaceSettingsForm } from "@/src/components/space-settings-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card"
import { Separator } from "@/src/components/ui/separator"

type SettingsTab = "general" | "brand-kit"

export default function SettingsPage() {
  const t = useTranslations('settings')
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")

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
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('brand-kit.title')}</CardTitle>
                <CardDescription>{t('brand-kit.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('brand-kit.coming-soon')}</p>
              </CardContent>
            </Card>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 border-r bg-muted/40 p-6">
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
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
} 