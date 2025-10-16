"use client"

import { useTranslations } from 'next-intl'
import { Badge } from '@/src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { Zap, Sparkles } from 'lucide-react'
import { AVATAR_MODEL_CREDIT_RATES } from '@/src/lib/cost'
import { AvatarModel } from './avatar-model-selector'

interface Veo3ModelSelectorProps {
  value: AvatarModel;
  onValueChange: (value: AvatarModel) => void;
}

export function Veo3ModelSelector({ 
  value, 
  onValueChange,
}: Veo3ModelSelectorProps) {
  const t = useTranslations('export-modal')

  const getTriggerContent = (currentValue: AvatarModel) => {
    switch (currentValue) {
      case 'veo-3-fast':
        return (
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>{t('veo-model-fast')}</span>
          </div>
        )
      case 'veo-3':
        return (
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span>{t('veo-model-standard')}</span>
          </div>
        )
      default:
        return <span>{t('veo-model-fast')}</span>
    }
  }

  return (
    <div className='space-y-[6px]'>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue>
            {getTriggerContent(value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Fast Model */}
          <SelectItem value="veo-3-fast">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Zap className="h-4 w-4" />
                <div className="flex flex-col w-56">
                  <span className="font-medium">
                    {t('veo-model-fast')}
                  </span>
                  <span className="text-xs text-muted-foreground">{t('veo-model-fast-description')}</span>
                </div>
              </div>
              <Badge variant="outline" className="ml-2 shrink-0">
                {t('credits-per-second', { credits: AVATAR_MODEL_CREDIT_RATES['veo-3-fast'].toString() })}
              </Badge>
            </div>
          </SelectItem>

          {/* Standard Model */}
          <SelectItem value="veo-3">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Sparkles className="h-4 w-4" />
                <div className="flex flex-col w-56">
                  <span className="font-medium">{t('veo-model-standard')}</span>
                  <span className="text-xs text-muted-foreground">{t('veo-model-standard-description')}</span>
                </div>
              </div>
              <Badge variant="outline" className="ml-2 shrink-0">
                {t('credits-per-second', { credits: AVATAR_MODEL_CREDIT_RATES['veo-3'].toString() })}
              </Badge>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

