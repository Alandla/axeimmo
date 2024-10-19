"use client"

import { Sparkles } from "lucide-react"
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/src/components/ui/sidebar"
import { useTranslations } from "next-intl"
import { cn } from "@/src/lib/utils"

export function NavButtonVideo() {
  const { isMobile } = useSidebar()
  const t = useTranslations('sidebar')

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            variant="black"
            size="lg"
            asChild
            tooltip={t('createVideo')}
            className="justify-center"
          >
            <a href="#" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className={cn("hidden md:inline", "group-data-[collapsible=icon]:hidden")}>
                {t('createVideo')}
              </span>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
