"use client"

import * as React from "react"
import { Check, ChevronsUpDown, DollarSign, Loader2, Plus, Settings2 } from "lucide-react"

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
import { useTranslations } from "next-intl"
import { Skeleton } from "./ui/skeleton"
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore"
import { SimpleSpace } from "../types/space"
import { useState } from "react"
import { basicApiCall } from "../lib/api"
import { useToast } from "../hooks/use-toast"

export function SpaceSwitcher({
  spaces
}: {
  spaces: SimpleSpace[]
}) {
  const t = useTranslations('sidebar')
  const tPlan = useTranslations('plan')
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const { toast } = useToast();
  const { activeSpace, setActiveSpace } = useActiveSpaceStore()

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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeSpace?.name && (
                  activeSpace.name?.charAt(0) ?? ''
                )}
              </div>
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
            <DropdownMenuItem>
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
                <div className={`flex size-6 items-center justify-center rounded-sm border`}>
                  {space.name?.charAt(0) ?? ''}
                </div>
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
  )
}
