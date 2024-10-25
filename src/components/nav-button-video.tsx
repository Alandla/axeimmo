"use client"

import { Sparkles } from "lucide-react"
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/src/components/ui/sidebar"
import { useTranslations } from "next-intl"
import { cn } from "@/src/lib/utils"
import Link from "next/link"

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
            <Link href="/dashboard/create" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className={cn("inline", "group-data-[collapsible=icon]:hidden")}>
                {t('createVideo')}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
