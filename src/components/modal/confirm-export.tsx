'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/src/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog"
import { Alert, AlertDescription } from "@/src/components/ui/alert"
import { Download, AlertCircle, HelpCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getSpaceById } from '@/src/service/space.service'
import { useRouter } from 'next/navigation'
import { AvatarModelSelector, AvatarModel, isAvatarModelAllowed, getRequiredPlanForModel } from '@/src/components/ui/avatar-model-selector'
import { IVideo } from '@/src/types/video'
import { calculateTotalAvatarDuration, calculateAvatarCreditsForUser, AVATAR_MODEL_CREDIT_RATES } from '@/src/lib/cost'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip"
import { Label } from '@radix-ui/react-dropdown-menu'
import ModalPricing from './modal-pricing'
import { PlanName } from '@/src/types/enums'

const formatCredits = (credits: number): string => {
  return credits % 1 === 0 ? credits.toFixed(0) : credits.toFixed(1)
}

interface ModalConfirmExportProps {
  cost: number
  spaceId: string
  initialCredits?: number
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  onExportVideo: (avatarModel?: AvatarModel) => Promise<string | undefined>
  showWatermark: boolean
  onOpenPricing?: () => void
  video?: IVideo
  planName?: string
}

export default function ModalConfirmExport({
  cost,
  spaceId,
  initialCredits,
  isOpen,
  setIsOpen,
  onExportVideo,
  showWatermark,
  onOpenPricing,
  video,
  planName
}: ModalConfirmExportProps) {
  const [isPending, setIsPending] = useState(false)
  const [credits, setCredits] = useState<number | undefined>(initialCredits)
  const [selectedAvatarModel, setSelectedAvatarModel] = useState<AvatarModel>('heygen')
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [pricingRecommendedPlan, setPricingRecommendedPlan] = useState<PlanName>(PlanName.PRO)
  const t = useTranslations('export-modal')
  const router = useRouter()

  // Calculate avatar duration and cost
  const hasAvatar = video?.video?.avatar && video.video.avatar.thumbnail && !video.video.avatar.previewUrl
  const avatarDuration = hasAvatar && video ? calculateTotalAvatarDuration(video) : 0
  const avatarCost = hasAvatar ? calculateAvatarCreditsForUser(avatarDuration, selectedAvatarModel) : 0
  const totalCost = cost + avatarCost

  const handleConfirm = async () => {
    // Check if the selected model is allowed for the current plan
    const currentPlanName = planName as PlanName | null
    if (!isAvatarModelAllowed(selectedAvatarModel, currentPlanName)) {
      const requiredPlan = getRequiredPlanForModel(selectedAvatarModel)
      if (requiredPlan) {
        setPricingRecommendedPlan(requiredPlan)
        setShowPricingModal(true)
        return
      }
    }

    setIsPending(true)
    const exportId = await onExportVideo(selectedAvatarModel)
    if (exportId) {
      await new Promise(resolve => setTimeout(resolve, 500))
      router.push(`/export/${exportId}`)
    }
    setIsPending(false)
    setIsOpen(false)
  }

  useEffect(() => {
    if (initialCredits !== undefined) {
      setCredits(initialCredits)
    }

    const fetchSpace = async () => {
      try {
        const space = await getSpaceById(spaceId)
        if (space?.credits !== undefined) {
          setCredits(space.credits)
        }
      } catch (error) {
        console.error('Error fetching space credits:', error)
      }
    }

    if (spaceId && isOpen) {
      fetchSpace()
    }
  }, [isOpen, spaceId, initialCredits])

  return (
    <>
      <Dialog 
        open={isOpen} 
        onOpenChange={setIsOpen}
      >
        <DialogContent 
          className="sm:max-w-[425px]" 
          onEscapeKeyDown={() => setIsOpen(false)}
          onInteractOutside={() => setIsOpen(false)}
        >
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>
              {t('description')}
            </DialogDescription>
            
            <div className="text-sm text-gray-500 mt-2 space-y-1">
              <p className="inline-flex items-center gap-1">
                <span className="font-bold text-primary">{t('cost')}:</span>
                <span className="text-gray-500">{formatCredits(totalCost)} credits</span>
                {avatarCost > 0 && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs whitespace-pre-line">
                        <p>{t('cost-details-tooltip', {
                          baseCost: formatCredits(cost),
                          avatarCost: formatCredits(avatarCost),
                          rate: AVATAR_MODEL_CREDIT_RATES[selectedAvatarModel],
                          duration: Math.round(avatarDuration)
                        })}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </p>
              <p>
                <span className="font-bold text-primary">{t('balance')}:</span>
                <span className="text-gray-500 ml-1">{credits !== undefined ? formatCredits(credits) : '...'} credits</span>
              </p>
            </div>

            {hasAvatar && video && (
              <div className="mt-4">
                <Label className="text-sm font-bold mb-2">{t('avatar-model-label')} :</Label>
                <AvatarModelSelector
                  value={selectedAvatarModel}
                  onValueChange={(value) => setSelectedAvatarModel(value as AvatarModel)}
                  planName={planName as any}
                  avatarDuration={avatarDuration}
                  showStandard={!!video?.video?.avatar?.previewUrl}
                />
              </div>
            )}

            {showWatermark && (
              <Alert 
                variant="warning" 
                className="cursor-pointer mt-2"
                onClick={() => {
                  setIsOpen(false)
                  onOpenPricing?.()
                }}
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('watermark-warning')}
                </AlertDescription>
              </Alert>
            )}
          </DialogHeader>
          <DialogFooter className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              {t('cancel-button')}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
            >
              <Download className="w-4 h-4" />
              {isPending ? t('saving') : t('export-button')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ModalPricing
        title={t('modal-pricing-avatar-title')}
        description={t('modal-pricing-avatar-description')}
        isOpen={showPricingModal}
        setIsOpen={setShowPricingModal}
        recommendedPlan={pricingRecommendedPlan}
      />
    </>
  )
}