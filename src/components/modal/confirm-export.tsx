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
import { calculateTotalAvatarDuration, calculateAvatarCreditsForUser, calculateHighResolutionCostCredits, AVATAR_MODEL_CREDIT_RATES, calculateVeo3Duration } from '@/src/lib/cost'
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
  onExportVideo: (model?: AvatarModel) => Promise<string | undefined>
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
  const [pricingModalType, setPricingModalType] = useState<'avatar' | 'veo3'>('avatar')
  const t = useTranslations('export-modal')
  const router = useRouter()


  // Calculate avatar duration and cost
  const hasAvatar = video?.video?.avatar?.thumbnail
  const avatarHasPreviewUrl = video?.video?.avatar?.previewUrl
  const isVeo3Model = selectedAvatarModel === 'veo-3' || selectedAvatarModel === 'veo-3-fast'
  const videoDuration = video?.video?.metadata?.audio_duration || 30
  
  // For Veo3, calculate duration based on video count * 8; for avatars, use only the duration when avatar is visible
  const avatarDuration = isVeo3Model && video
    ? calculateVeo3Duration(video)
    : (hasAvatar && video ? calculateTotalAvatarDuration(video) : 0)
  
  const avatarCost = hasAvatar
    ? calculateAvatarCreditsForUser(avatarDuration, selectedAvatarModel) 
    : 0
  
  // Calculate high resolution cost (only for custom format)
  const videoFormat = video?.video?.format
  let highResCost = 0
  
  if (videoFormat === 'custom' && video?.video?.width && video?.video?.height) {
    highResCost = calculateHighResolutionCostCredits(
      videoDuration,
      video.video.width,
      video.video.height
    )
  }
  
  const totalCost = cost + avatarCost + highResCost

  const handleConfirm = async () => {
    const currentPlanName = planName as PlanName | null
    
    // Check if the selected model is allowed for the current plan
    if (!isAvatarModelAllowed(selectedAvatarModel, currentPlanName)) {
      const requiredPlan = getRequiredPlanForModel(selectedAvatarModel)
      if (requiredPlan) {
        // Set the right modal type based on model
        setPricingModalType(isVeo3Model ? 'veo3' : 'avatar')
        setPricingRecommendedPlan(requiredPlan)
        setShowPricingModal(true)
        setIsOpen(false)
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
    if (!isOpen) return
    
    // Initialize model based on video settings and avatar previewUrl
    const avatarHasPreview = video?.video?.avatar?.previewUrl
    if (!avatarHasPreview && video?.useVeo3) {
      setSelectedAvatarModel('veo-3-fast')
    } else if (avatarHasPreview) {
      // If avatar has preview, use standard model (selector won't be shown)
      setSelectedAvatarModel('heygen')
    } else {
      // If avatar doesn't have preview, use premium model (standard is hidden)
      setSelectedAvatarModel('heygen-iv')
    }

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

    if (spaceId) {
      fetchSpace()
    }
  }, [isOpen, spaceId, initialCredits, video?.useVeo3, video?.video?.avatar?.previewUrl])

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
                {(avatarCost > 0 || highResCost > 0) && (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs whitespace-pre-line">
                        <div className="space-y-1">
                          <p>{t('base-cost')}: {formatCredits(cost)} credits</p>
                          {avatarCost > 0 && (
                            <p>{t('avatar-cost-tooltip', {
                              avatarCost: formatCredits(avatarCost),
                              rate: AVATAR_MODEL_CREDIT_RATES[selectedAvatarModel],
                              duration: Math.round(avatarDuration)
                            })}</p>
                          )}
                          {highResCost > 0 && (
                            <p>{t('high-res-cost-tooltip', {
                              highResCost: formatCredits(highResCost)
                            })}</p>
                          )}
                        </div>
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

            {hasAvatar && video && !avatarHasPreviewUrl && (video?.video?.avatar?.id || !video?.video?.avatar?.videoUrl) && (
              <div className="mt-4">
                <Label className="text-sm font-bold mb-2">
                  {t('avatar-model-label')} :
                </Label>
                <AvatarModelSelector
                  value={selectedAvatarModel}
                  onValueChange={(value) => setSelectedAvatarModel(value)}
                  planName={planName as any}
                  avatarDuration={avatarDuration}
                  showStandard={false}
                  showVeoModels={!avatarHasPreviewUrl}
                  showNonVeoModels={!video.useVeo3}
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
        title={t(pricingModalType === 'veo3' ? 'modal-pricing-veo3-title' : 'modal-pricing-avatar-title')}
        description={t(pricingModalType === 'veo3' ? 'modal-pricing-veo3-description' : 'modal-pricing-avatar-description')}
        isOpen={showPricingModal}
        setIsOpen={setShowPricingModal}
        recommendedPlan={pricingRecommendedPlan}
      />
    </>
  )
}