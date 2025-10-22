"use client"

import { useTranslations } from 'next-intl'
import { Label } from '@/src/components/ui/label'
import { Badge } from '@/src/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/components/ui/select'
import { PlanName } from '@/src/types/enums'
import { Zap, Gem, Crown } from 'lucide-react'
import { AVATAR_MODEL_CREDIT_RATES } from '@/src/lib/cost'
import { IconGoogle } from '@/src/components/icons/google-icon'

export type AvatarModel = 'heygen' | 'heygen-iv' | 'omnihuman' | 'veo-3' | 'veo-3-fast';

export function isAvatarModelAllowed(model: AvatarModel, planName: PlanName | null): boolean {
  if (model === 'heygen') return true; // Standard is always allowed
  if (model === 'heygen-iv' || model === 'veo-3' || model === 'veo-3-fast') {
    return planName === PlanName.START || planName === PlanName.PRO || planName === PlanName.ENTREPRISE;
  }
  if (model === 'omnihuman') {
    return planName === PlanName.ENTREPRISE;
  }
  return false;
}

export function getRequiredPlanForModel(model: AvatarModel): PlanName | null {
  if (model === 'heygen') return null; // No specific plan required
  if (model === 'heygen-iv' || model === 'veo-3' || model === 'veo-3-fast') return PlanName.START;
  if (model === 'omnihuman') return PlanName.ENTREPRISE;
  return null;
}

interface AvatarModelSelectorProps {
  value: AvatarModel;
  onValueChange: (value: AvatarModel) => void;
  planName: PlanName | null;
  avatarDuration: number;
  showStandard?: boolean;
  showVeoModels?: boolean;
  showNonVeoModels?: boolean;
}

export function AvatarModelSelector({ 
  value, 
  onValueChange, 
  planName,
  avatarDuration,
  showStandard = true,
  showVeoModels = false,
  showNonVeoModels = true
}: AvatarModelSelectorProps) {
  const t = useTranslations('export-modal')
  const planT = useTranslations('plan')

  const handleOpenChange = (open: boolean) => {
    if (!open) return
    
    // If standard is not shown and current value is standard, switch to premium
    if (!showStandard && value === 'heygen') {
      onValueChange('heygen-iv')
    }
    
    // If veo models are not shown and current value is a veo model, switch to heygen-iv
    if (!showVeoModels && (value === 'veo-3' || value === 'veo-3-fast')) {
      onValueChange('heygen-iv')
    }

    // If non-veo models are not shown and current value is a non-veo model, switch to veo-3-fast
    if (!showNonVeoModels && (value === 'heygen' || value === 'heygen-iv' || value === 'omnihuman')) {
      onValueChange('veo-3-fast')
    }
  }

  // Fonction pour obtenir le contenu du trigger basé sur la valeur sélectionnée
  const getTriggerContent = (value: AvatarModel) => {
    switch (value) {
      case 'heygen':
        return (
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>{t('avatar-model-standard')}</span>
          </div>
        )
      case 'heygen-iv':
        return (
          <div className="flex items-center gap-2">
            <Gem className="h-4 w-4" />
            <span>{t('avatar-model-premium')}</span>
          </div>
        )
      case 'omnihuman':
        return (
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4" />
            <span>{t('avatar-model-ultra')}</span>
          </div>
        )
      case 'veo-3-fast':
        return (
          <div className="flex items-center gap-2">
            <IconGoogle className="h-4 w-4" />
            <span>{t('veo-model-fast')}</span>
          </div>
        )
      case 'veo-3':
        return (
          <div className="flex items-center gap-2">
            <IconGoogle className="h-4 w-4" />
            <span>{t('veo-model-standard')}</span>
          </div>
        )
      default:
        return <span>{t('avatar-model-standard')}</span>
    }
  }

  return (
    <div className='space-y-[6px]'>
      <Select value={value} onValueChange={onValueChange} onOpenChange={handleOpenChange}>
        <SelectTrigger>
          <SelectValue>
            {getTriggerContent(value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {/* Standard Model */}
          {showStandard && showNonVeoModels && (
            <SelectItem value="heygen">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Zap className="h-4 w-4" />
                  <div className="flex flex-col w-56">
                    <span className="font-medium">
                      {t('avatar-model-standard')}
                    </span>
                    <span className="text-xs text-muted-foreground">{t('avatar-model-standard-description')}</span>
                  </div>
                </div>
                <Badge variant="outline" className="ml-2 shrink-0">
                  {t('credits-per-second', { credits: AVATAR_MODEL_CREDIT_RATES.heygen.toString() })}
                </Badge>
              </div>
            </SelectItem>
          )}

          {/* Premium Model */}
          {showNonVeoModels && (
          <SelectItem 
            value="heygen-iv"
            disabled={planName !== PlanName.START && planName !== PlanName.PRO && planName !== PlanName.ENTREPRISE}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Gem className="h-4 w-4" />
                <div className="flex flex-col w-56">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t('avatar-model-premium')}</span>
                    {planName !== PlanName.START && planName !== PlanName.PRO && planName !== PlanName.ENTREPRISE && (
                      <Badge variant="plan">
                        {planT(PlanName.START)}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{t('avatar-model-premium-description')}</span>
                </div>
              </div>
              <Badge variant="outline" className="ml-2 shrink-0">
                {t('credits-per-second', { credits: AVATAR_MODEL_CREDIT_RATES['heygen-iv'].toString() })}
              </Badge>
            </div>
          </SelectItem>
          )}

          {/* Ultra Model */}
          {showNonVeoModels && (
          <SelectItem 
            value="omnihuman"
            disabled={planName !== PlanName.ENTREPRISE}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Crown className="h-4 w-4" />
                <div className="flex flex-col w-56">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t('avatar-model-ultra')}</span>
                    {planName !== PlanName.ENTREPRISE && (
                      <Badge variant="plan">
                        {planT(PlanName.ENTREPRISE)}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{t('avatar-model-ultra-description')}</span>
                </div>
              </div>
              <Badge variant="outline" className="ml-2 shrink-0">
                {t('credits-per-second', { credits: AVATAR_MODEL_CREDIT_RATES.omnihuman.toString() })}
              </Badge>
            </div>
          </SelectItem>
          )}

          {/* Veo3 Models */}
          {showVeoModels && (
            <>
              {/* Veo3 Fast Model */}
              <SelectItem 
                value="veo-3-fast"
                disabled={planName !== PlanName.START && planName !== PlanName.PRO && planName !== PlanName.ENTREPRISE}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <IconGoogle className="h-4 w-4" />
                    <div className="flex flex-col w-56">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t('veo-model-fast')}</span>
                        {planName !== PlanName.START && planName !== PlanName.PRO && planName !== PlanName.ENTREPRISE && (
                          <Badge variant="plan">
                            {planT(PlanName.START)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{t('veo-model-fast-description')}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {t('credits-per-second', { credits: AVATAR_MODEL_CREDIT_RATES['veo-3-fast'].toString() })}
                  </Badge>
                </div>
              </SelectItem>

              {/* Veo3 Standard Model */}
              <SelectItem 
                value="veo-3"
                disabled={planName !== PlanName.START && planName !== PlanName.PRO && planName !== PlanName.ENTREPRISE}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <IconGoogle className="h-4 w-4" />
                    <div className="flex flex-col w-56">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t('veo-model-standard')}</span>
                        {planName !== PlanName.START && planName !== PlanName.PRO && planName !== PlanName.ENTREPRISE && (
                          <Badge variant="plan">
                            {planT(PlanName.START)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{t('veo-model-standard-description')}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2 shrink-0">
                    {t('credits-per-second', { credits: AVATAR_MODEL_CREDIT_RATES['veo-3'].toString() })}
                  </Badge>
                </div>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

