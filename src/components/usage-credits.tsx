import { Button } from "@/src/components/ui/button"
import { Progress } from "@/src/components/ui/progress"
import { Rocket, Sparkles, Zap } from 'lucide-react'
import { useActiveSpaceStore } from "../store/activeSpaceStore"
import { useTranslations } from "next-intl"
import { useSidebar } from "@/src/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import Link from "next/link"

export function UsageCredits() {
  const t = useTranslations('sidebar')
  const { activeSpace } = useActiveSpaceStore()
  const { open } = useSidebar()
  const percentage = activeSpace ? (activeSpace?.credits / activeSpace?.creditsPerMonth) * 100 : 0

  if (!activeSpace) {
    if (!open) {
      return (
        <div className="p-4 bg-sidebar-accent rounded-lg space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-sidebar-foreground/50" />
              <div className="h-3 w-24 bg-sidebar-foreground/20 rounded animate-pulse" />
            </div>
            <Progress value={0} className="h-2" />
          </div>
          <Link href="/dashboard/pricing">
            <Button variant="outline" size="sm" className="text-xs w-full opacity-50" disabled>
              <Rocket className="w-3 h-3" />
              {t('upgrade')}
            </Button>
          </Link>
        </div>
      )
    }

    return (
      <div className="p-4 bg-sidebar-accent rounded-lg space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-sidebar-foreground/50" />
            <div className="h-3 w-24 bg-sidebar-foreground/20 rounded animate-pulse mb-1" />
          </div>
          <Progress value={0} className="h-2" />
        </div>
        <Link href="/dashboard/pricing">
          <Button variant="outline" size="sm" className="text-xs w-full opacity-50" disabled>
            <Rocket className="w-3 h-3" />
            {t('upgrade')}
          </Button>
        </Link>
      </div>
    )
  }

  if (!open) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-2 bg-sidebar-accent rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium">{activeSpace?.credits}</span>
              </div>
              <Link href="/dashboard/pricing">
                <Button variant="outline" size="icon">
                  <Rocket className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="text-sm">
            {activeSpace?.credits} / {activeSpace?.creditsPerMonth} {t('credits-used')}
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="p-4 bg-sidebar-accent rounded-lg space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-1 text-xs text-sidebar-foreground/70">
          <Sparkles className="w-3 h-3" />
          <span>{activeSpace?.credits} / {activeSpace?.creditsPerMonth} {t('credits-used')}</span>
        </div>
        <Progress value={percentage > 100 ? 100 : percentage} className="h-2" />
      </div>
      <Link href="/dashboard/pricing" className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="text-xs w-full justify-center">
          <Rocket className="w-3 h-3" />
          {t('upgrade')}
        </Button>
      </Link>
    </div>
  )
}

