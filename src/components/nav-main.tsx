"use client"

import { type LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar"
import { useTranslations } from "next-intl"
import Link from "next/link"

export function NavMain({
  items,
  title,
}: {
  items: {
    name: string
    url: string
    icon: LucideIcon | React.ComponentType<any>
    external?: boolean
  }[]
  title?: string
}) {
  const { isMobile } = useSidebar()
  const t = useTranslations('sidebar')

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title || t('links.title')}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild tooltip={item.name}>
              {item.external ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  <item.icon />
                  <span>{item.name}</span>
                </a>
              ) : (
                <Link href={item.url} prefetch={true}>
                  <item.icon />
                  <span>{item.name}</span>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
