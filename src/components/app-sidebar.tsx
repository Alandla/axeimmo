"use client"

import * as React from "react"
import { useEffect } from "react"
import {
  Home,
  Image as ImageIcon,
  MessageSquare,
  DollarSign,
  HelpCircle,
  UserCircle,
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
import { useTranslations, useLocale } from "next-intl"
import { NavButtonVideo } from "./nav-button-video"
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore"
import { fetchSpaceMembers, getSpaces } from "../service/user.service"
import { SpaceSwitcher } from "./space-switcher"
import { SimpleSpace } from "../types/space"
import { UsageCredits } from "./usage-credits"
import { DiscordLogoIcon } from "@radix-ui/react-icons"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()

  const t = useTranslations('sidebar')
  const locale = useLocale()
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()
  const [spaces, setSpaces] = React.useState<SimpleSpace[]>([])

  const getHelpCenterUrl = () => {
    if (locale === 'fr') {
      return 'https://www.notion.so/HOOX-Centre-d-aide-1fba39ae7e1280e2befdedd97df34319'
    }
    return 'https://www.notion.so/HOOX-Help-Center-1fba39ae7e128068a5f6cf526db8f4b5'
  }

  useEffect(() => {
    const fetchSpaces = async () => {
      const userSpaces = await getSpaces()
      console.log("userSpaces", userSpaces);
      if (userSpaces) {
        setSpaces(userSpaces)
        if (!activeSpace && userSpaces.length > 0) {
          setActiveSpace(userSpaces[0])
        }

        const spacesWithMembers = await fetchSpaceMembers(userSpaces);

        setSpaces(spacesWithMembers)
        setActiveSpace(spacesWithMembers[0])
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
      name: `${t('links.assets')}`,
      url: "/dashboard/assets",
      icon: ImageIcon,
    },
    {
      name: `${t('links.avatars')}`,
      url: "/dashboard/avatar",
      icon: UserCircle,
    },
  ]

  const communityLinks = [
    {
      name: `${t('community.discord')}`,
      url: "https://discord.com/invite/jGaPsGGDpC",
      icon: DiscordLogoIcon,
      external: true,
    },
    {
      name: `${t('community.affiliates')}`,
      url: "https://affiliates.hoox.video/",
      icon: DollarSign,
      external: true,
    },
    {
      name: `${t('community.help-center')}`,
      url: getHelpCenterUrl(),
      icon: HelpCircle,
      external: true,
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
        <NavMain items={communityLinks} title={t('community.title')} />
      </SidebarContent>
      <SidebarFooter>
        <UsageCredits />
        <NavUser user={session?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
