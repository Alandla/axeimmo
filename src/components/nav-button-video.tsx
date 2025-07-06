"use client"

import { Sparkles } from "lucide-react"
import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/src/components/ui/sidebar"
import { useTranslations } from "next-intl"
import { cn } from "@/src/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavButtonVideo() {
  const { isMobile } = useSidebar()
  const t = useTranslations('sidebar')
  const pathname = usePathname()

  const isActive = pathname.startsWith("/dashboard/create")

  return (
    <SidebarGroup>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            variant={isActive ? "outline" : "black"}
            size="lg"
            asChild
            tooltip={t('createVideo')}
            className="justify-center"
          >
            <Link href="/dashboard/create" prefetch={true} className="flex items-center gap-2">
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
