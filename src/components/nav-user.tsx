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

export function NavUser({
  user,
}: {
  user: User | undefined
}) {
  const t = useTranslations('sidebar')
  
  const { isMobile } = useSidebar()
  let loading = false

  if (!user) {
    loading = true
    user = {
      name: "Loading...",
      email: "loading@mail.com",
    }
  }

  const handleLogout = () => {
    signOut({
      callbackUrl: "/",
    })
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user?.image && <AvatarImage src={user.image} alt={user.name ?? ''} />}
                <AvatarFallback className="rounded-lg">{loading ? '' : (user.name?.charAt(0) ?? '')}</AvatarFallback>
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
                  <AvatarFallback className="rounded-lg">{user.name?.charAt(0) ?? ''}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Settings2 />
                {t('user.settings')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className={cn(
                "flex items-center cursor-pointer",
                "hover:bg-red-200 hover:text-red-600",
                "focus:bg-red-200 focus:text-red-600"
              )}
            >
              <LogOut />
              {t('user.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
