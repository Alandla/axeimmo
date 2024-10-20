"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Home,
  Image,
  Video,
} from "lucide-react"


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
import { getSpaces } from "../service/user"
import { SimpleSpace } from "../types/space"
import { SpaceSwitcher } from "./space-switcher"

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      planName: "Enterprise",
      creditsPerMonth: 0,
      credits: 0,
      userRole: "owner",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      planName: "Startup",
      creditsPerMonth: 0,
      credits: 0,
      userRole: "owner",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      planName: "Free",
      creditsPerMonth: 0,
      credits: 0,
      userRole: "owner",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  const t = useTranslations('sidebar')
  const [spaces, setSpaces] = React.useState<SimpleSpace[]>([])
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()

  React.useEffect(() => {
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

  const links = [
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
      icon: Image,
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SpaceSwitcher spaces={spaces} />
      </SidebarHeader>
      <SidebarContent>
        <NavButtonVideo />
        <NavMain items={links} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={session?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
