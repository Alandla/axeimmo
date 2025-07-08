"use client"

import * as React from "react"
import { Check, ChevronsUpDown, DollarSign, Loader2, Plus, Settings2, Image } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/src/components/ui/avatar"
import { useTranslations } from "next-intl"
import { Skeleton } from "./ui/skeleton"
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore"
import { SimpleSpace } from "../types/space"
import { useState } from "react"
import { basicApiCall } from "../lib/api"
import { useToast } from "../hooks/use-toast"
import { SpaceSettingsDrawer } from "./space-settings-drawer"

export function SpaceSwitcher({
  spaces
}: {
  spaces: SimpleSpace[]
}) {
  const t = useTranslations('sidebar')
  const tPlan = useTranslations('plan')
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const { toast } = useToast();
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const openStripePortal = async () => {
    setIsLoadingBilling(true);
    try {
      const stripePortalURL: string = await basicApiCall('/stripe/createPortal', {
        spaceId: activeSpace?.id,
        returnUrl: window.location.href,
      });
      if (stripePortalURL) {
        window.location.href = stripePortalURL;
      }
    } catch (error : any) {
      toast({
        title: t('billing.error-title'),
        description: t('billing.error-description'),
        variant: 'destructive',
      })
    }
    setIsLoadingBilling(false);
  };

  const handleSettingsClick = () => {
    setIsSettingsDrawerOpen(true);
    setIsDropdownOpen(false);
  };

  const handleDrawerClose = () => {
    setIsSettingsDrawerOpen(false);
  };

  return (
    <>
      <SpaceSettingsDrawer 
        open={isSettingsDrawerOpen}
        onClose={handleDrawerClose}
      />
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  {activeSpace?.logoUrl ? (
                    <AvatarImage src={activeSpace.logoUrl} alt={activeSpace.name} />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {activeSpace?.name?.charAt(0) ?? ''}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                  {!activeSpace?.name ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    activeSpace.name
                  )}
                  </span>
                  <span className="truncate text-xs">
                    {!activeSpace?.planName ? (
                      <Skeleton className="h-3 w-10 mt-1" />
                    ) : (
                      tPlan(activeSpace.planName)
                    )}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={"bottom"}
              sideOffset={4}
            >
              <DropdownMenuItem onSelect={handleSettingsClick}>
                <Settings2 />
                {t('teams.settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openStripePortal}>
                {isLoadingBilling ? <Loader2 className="animate-spin" /> : <DollarSign />}
                {t('billing.title')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t('teams.spaces')}
              </DropdownMenuLabel>
              {spaces?.length > 0 && spaces.map((space, index) => (
                <DropdownMenuItem
                  key={space.name}
                  className="gap-2 p-2"
                  onClick={() => setActiveSpace(space)}
                >
                  <Avatar className="h-6 w-6 rounded-sm">
                    {space.logoUrl ? (
                      <AvatarImage src={space.logoUrl} alt={space.name} />
                    ) : null}
                    <AvatarFallback className="rounded-sm text-xs">
                      {space.name?.charAt(0) ?? ''}
                    </AvatarFallback>
                  </Avatar>
                  {space.name}
                  {space === activeSpace && (
                    <div className="ml-auto text-xs tracking-widest opacity-60">
                      <Check className="size-4"/>
                    </div>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">
                  {t('teams.joinSpaces')}
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}
