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
import { TeamSwitcher } from "@/src/components/team-switcher"
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

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  const t = useTranslations('sidebar')

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
        <TeamSwitcher teams={data.teams} />
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
