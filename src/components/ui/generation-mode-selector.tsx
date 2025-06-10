"use client"

import { useTranslations } from 'next-intl'
import { Label } from '@/src/components/ui/label'
import { Badge } from '@/src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { KlingGenerationMode, KLING_GENERATION_COSTS } from '@/src/lib/fal'
import { PlanName } from '@/src/types/enums'
import { SimpleSpace } from '@/src/types/space'
import { Zap, Gem, Crown } from 'lucide-react'

interface GenerationModeSelectorProps {
  value: KlingGenerationMode
  onValueChange: (value: string) => void
  activeSpace: SimpleSpace | null
}

export function GenerationModeSelector({ 
  value, 
  onValueChange, 
  activeSpace
}: GenerationModeSelectorProps) {
  const t = useTranslations('assets')
  const planT = useTranslations('plan')

  const remainingGenerations = activeSpace ? (activeSpace.imageToVideoLimit || 0) - (activeSpace.imageToVideoUsed || 0) : 0
  const isNotEnterprise = activeSpace?.planName !== PlanName.ENTREPRISE

  // Fonction pour obtenir le contenu du trigger basé sur la valeur sélectionnée
  const getTriggerContent = (value: KlingGenerationMode) => {
    switch (value) {
      case KlingGenerationMode.STANDARD:
        return (
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>{t('mode-standard')}</span>
          </div>
        )
      case KlingGenerationMode.PRO:
        return (
          <div className="flex items-center gap-2">
            <Gem className="h-4 w-4" />
            <span>{t('mode-ultra')}</span>
          </div>
        )
      default:
        return <span>{t('select-generation-mode')}</span>
    }
  }

  return (
    <div className='space-y-[6px]'>
      <Label className="text-sm font-medium">{t('generation-mode')}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue>
            {getTriggerContent(value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={KlingGenerationMode.STANDARD}>
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Zap className="h-4 w-4" />
                <div className="flex flex-col w-56">
                  <span className="font-medium">
                    {t('mode-standard')}
                    {isNotEnterprise && (
                      <span className="font-light text-xs text-muted-foreground ml-1">
                        ({t('generations-left', { count: remainingGenerations })})
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">{t('mode-standard-description')}</span>
                </div>
              </div>
              <Badge variant="outline" className="ml-2 shrink-0">
                {KLING_GENERATION_COSTS[KlingGenerationMode.STANDARD]} {t('credits-cost')}
              </Badge>
            </div>
          </SelectItem>
          <SelectItem 
            value={KlingGenerationMode.PRO}
            disabled={activeSpace?.planName !== PlanName.ENTREPRISE}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Gem className="h-4 w-4" />
                <div className="flex flex-col w-56">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t('mode-ultra')}</span>
                    {activeSpace?.planName !== PlanName.ENTREPRISE && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-[#FB5688] to-[#9C2779] text-white text-xs border-none shadow-sm font-semibold">
                        {planT(PlanName.ENTREPRISE)}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{t('mode-ultra-description')}</span>
                </div>
              </div>
              <Badge variant="outline" className="ml-2 shrink-0">
                {KLING_GENERATION_COSTS[KlingGenerationMode.PRO]} {t('credits-cost')}
              </Badge>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
} 