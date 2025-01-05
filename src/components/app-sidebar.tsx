"use client"

import * as React from "react"
import { useEffect } from "react"
import {
  Home,
  Video,
  Image as ImageIcon,
} from "lucide-react"
import Image from "next/image"

import { NavUser } from "@/src/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/src/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { NavButtonVideo } from "./nav-button-video"
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore"
import { getSpaces } from "../service/user.service"
import { SpaceSwitcher } from "./space-switcher"
import { SimpleSpace } from "../types/space"
import { UsageCredits } from "./usage-credits"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  const t = useTranslations('sidebar')
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()
  const [spaces, setSpaces] = React.useState<SimpleSpace[]>([])

  useEffect(() => {
    const fetchSpaces = async () => {
      const userSpaces = await getSpaces()
      if (userSpaces) {
        setSpaces(userSpaces)
        if (!activeSpace && userSpaces.length > 0) {
          setActiveSpace(userSpaces[0])
        }
      }
    }
    fetchSpaces()
  }, [])

  const linksFuture = [
    {
      name: `${t('links.home')}`,
      url: "/dashboard",
      icon: Home,
    },
    {
      name: `${t('links.videos')}`,
      url: "/videos",
      icon: Video,
    },
    {
      name: `${t('links.assets')}`,
      url: "/assets",
      icon: ImageIcon,
    },
  ]

  const links = [
    {
      name: `${t('links.home')}`,
      url: "/dashboard",
      icon: Home,
    },
    {
      name: `${t('links.videos')}`,
      url: "/dashboard/videos",
      icon: Video,
    },
    {
      name: `${t('links.assets')}`,
      url: "/dashboard/assets",
      icon: ImageIcon,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="w-full py-2 flex items-center justify-center">
          <Image
            src="/img/logo_little.png"
            alt="Logo"
            width={120}
            height={40}
            className="w-auto h-auto"
            priority
          />
        </div>
        <SpaceSwitcher spaces={spaces} />
      </SidebarHeader>
      <SidebarContent>
        <NavButtonVideo />
        <NavMain items={links} />
      </SidebarContent>
      <SidebarFooter>
        <UsageCredits />
        <NavUser user={session?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
