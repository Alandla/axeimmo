"use client"

import {
  ChevronsUpDown,
  LogOut,
  Settings2,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/src/components/ui/sidebar"
import { User } from "next-auth"
import { Skeleton } from "./ui/skeleton"
import { cn } from "../lib/utils"
import { signOut } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { SettingsDrawer } from "./settings-drawer"
import { reset } from '@/src/utils/mixpanel'

export function NavUser({
  user,
}: {
  user: User | undefined
}) {
  const t = useTranslations('sidebar')
  
  const { isMobile } = useSidebar()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  let loading = false

  if (!user) {
    loading = true
    user = {
      name: "Loading...",
      email: "loading@mail.com",
    }
  }

  const handleLogout = () => {
    reset();
    signOut({
      callbackUrl: "/",
    })
  }

  const handleSettingsClick = () => {
    setIsDrawerOpen(true)
    setIsDropdownOpen(false)
  }

  const handleDrawerClose = () => {
    setIsDrawerOpen(false)
  }

  return (
    <>
    <SettingsDrawer open={isDrawerOpen} onClose={handleDrawerClose} user={user} />
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu 
          open={isDropdownOpen}
          onOpenChange={setIsDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user?.image && <AvatarImage src={user.image} alt={user.name ?? ''} />}
                <AvatarFallback className="rounded-lg">
                  {loading ? '' : (user.name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? '')}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {loading ? (
                  <>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </>
                ) : (
                  <>
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                  </>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={"bottom"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user?.image && <AvatarImage src={user.image} alt={user.name ?? ''} />}
                  <AvatarFallback className="rounded-lg">{user.name?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase() ?? ''}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={handleSettingsClick}>
                <Settings2 />
                {t('user.settings')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleLogout}
              className={cn(
                "flex items-center cursor-pointer text-destructive",
                "hover:bg-red-200 hover:text-destructive",
                "focus:bg-red-200 focus:text-destructive"
              )}
            >
              <LogOut />
              {t('user.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
    </>
  )
}
