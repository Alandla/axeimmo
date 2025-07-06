'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/src/components/ui/button'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { Badge } from '@/src/components/ui/badge'
import { Loader2, Sparkles, ArrowLeft, Lightbulb } from 'lucide-react'
import { basicApiCall } from '@/src/lib/api'
import { useToast } from '@/src/hooks/use-toast'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import { IMediaSpace } from '@/src/types/space'
import Image from 'next/image'
import { GenerationModeSelector } from '@/src/components/ui/generation-mode-selector'
import { KlingGenerationMode, KLING_GENERATION_COSTS } from '@/src/lib/fal'
import { PlanName } from '@/src/types/enums'
import { usePremiumToast } from '@/src/utils/premium-toast'

interface ImageToVideoEnhancerProps {
  mediaSpace?: IMediaSpace
  mediaId?: string
  onBack?: () => void
  onSuccess?: (result: any) => void
  isModal?: boolean
}

export default function ImageToVideoEnhancer({ 
  mediaSpace: initialMediaSpace, 
  mediaId,
  onBack, 
  onSuccess, 
  isModal = false 
}: ImageToVideoEnhancerProps) {
  const t = useTranslations('assets')
  const planT = useTranslations('plan')
  const pricingT = useTranslations('pricing')
  const { toast } = useToast()
  const { activeSpace } = useActiveSpaceStore()
  const { decrementCredits, incrementImageToVideoUsage } = useActiveSpaceStore()
  const { showPremiumToast } = usePremiumToast()
  
  const [mediaSpace, setMediaSpace] = useState<IMediaSpace | null>(initialMediaSpace || null)
  const [loadingMedia, setLoadingMedia] = useState(!initialMediaSpace && !!mediaId)
  const [loadingStagingIdeas, setLoadingStagingIdeas] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [context, setContext] = useState('')
  const [generationMode, setGenerationMode] = useState<KlingGenerationMode>(KlingGenerationMode.STANDARD)
  const [stagingIdeas, setStagingIdeas] = useState<string[] | null>(null)

  useEffect(() => {
    const fetchMediaAndIdeas = async () => {
      if (!activeSpace?.id) return

      try {
        let currentMedia = mediaSpace
        if (!currentMedia && mediaId) {
          setLoadingMedia(true)
          currentMedia = await basicApiCall<IMediaSpace>('/media/get', {
            spaceId: activeSpace.id,
            mediaId
          })
          setMediaSpace(currentMedia)
          setLoadingMedia(false)
        }

        if (
          currentMedia &&
          currentMedia.media.type === 'image' &&
          currentMedia.media.image?.link &&
          stagingIdeas === null
        ) {
          try {
            setLoadingStagingIdeas(true)
            const ideasResult: any = await basicApiCall('/media/staging-ideas', {
              imageUrl: currentMedia.media.image.link
            })
            setStagingIdeas(ideasResult.stagingIdeas)
          } catch (err) {
            console.error('Error fetching staging ideas:', err)
            toast({
              title: t('toast.error'),
              description: t('toast.staging-ideas-error'),
              variant: 'destructive'
            })
          } finally {
            setLoadingStagingIdeas(false)
          }
        }
      } catch (err) {
        console.error('Error fetching media:', err)
        toast({
          title: t('toast.error'),
          description: 'Impossible de charger le média',
          variant: 'destructive'
        })
        setLoadingMedia(false)
      }
    }

    if ((mediaId && !initialMediaSpace) || (mediaSpace && stagingIdeas === null)) {
      console.log('fetching media and ideas')
      fetchMediaAndIdeas()
    }
  }, [activeSpace?.id, mediaId, initialMediaSpace])

  const handleIdeaClick = (idea: string) => {
    const newContext = context ? `${context}\n${idea}` : idea
    setContext(newContext)
  }

  const handleModeChange = (value: string) => {
    const mode = value as KlingGenerationMode
    
    if (mode === KlingGenerationMode.PRO && activeSpace?.planName !== PlanName.ENTREPRISE) {
      showPremiumToast(
        t('toast.title-error'),
        pricingT('premium-toast.description', { plan: planT(PlanName.ENTREPRISE) }),
        pricingT('upgrade')
      )
      return
    }
    
    setGenerationMode(mode)
  }

  const handleGenerate = async () => {
    if (!mediaSpace || !activeSpace?.id) return

    const selectedCost = KLING_GENERATION_COSTS[generationMode]
    
    if (activeSpace.credits < selectedCost) {
      toast({
        title: t('insufficient-credits'),
        description: t('insufficient-credits-description'),
        variant: 'destructive'
      })
      return
    }

    if (activeSpace.planName !== PlanName.ENTREPRISE) {
      const remainingGenerations = (activeSpace.imageToVideoLimit || 0) - (activeSpace.imageToVideoUsed || 0)
      if (remainingGenerations <= 0) {
        toast({
          title: t('generation-limit-reached'),
          description: t('generation-limit-reached-description'),
          variant: 'destructive'
        })
        return
      }
    }

    setGenerating(true)

    try {
      toast({
        title: t('toast.generating'),
        description: t('toast.generating-video-description'),
        variant: 'loading'
      })

      const result: any = await basicApiCall('/media/enhance', {
        mediaSpace,
        spaceId: activeSpace.id,
        type: 'video',
        context,
        mode: generationMode
      })

      decrementCredits(selectedCost)
      if (activeSpace.planName !== PlanName.ENTREPRISE) {
        incrementImageToVideoUsage()
      }

      toast({
        title: t('toast.enhancement-started'),
        description: t('toast.enhancement-started-description'),
        variant: 'confirm'
      })

      if (onSuccess) {
        onSuccess(result?.mediaSpace)
      }
    } catch (error) {
      console.error('Error generating enhancement:', error)
      toast({
        title: t('toast.error'),
        description: t('toast.generation-error-description'),
        variant: 'destructive'
      })
    } finally {
      setGenerating(false)
    }
  }

  if (!mediaSpace && !loadingMedia) {
    return null
  }

  const selectedCost = KLING_GENERATION_COSTS[generationMode]
  const hasInsufficientCredits = activeSpace ? activeSpace.credits < selectedCost : false
  const remainingGenerations = activeSpace ? (activeSpace.imageToVideoLimit || 0) - (activeSpace.imageToVideoUsed || 0) : 0
  const hasReachedLimit = activeSpace && activeSpace?.planName !== PlanName.ENTREPRISE && remainingGenerations <= 0

  return (
    <div className="space-y-6">
      {/* Preview de l'image */}
      <div className="flex flex-col items-center space-y-2">
        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-muted">
          {loadingMedia ? (
            <div className="w-full h-full bg-muted animate-pulse"></div>
          ) : (
            mediaSpace?.media.type === 'image' && (
              <Image
                src={mediaSpace.media.image?.link || ''}
                alt={mediaSpace.media.name}
                fill
                className="object-contain"
                priority
              />
            )
          )}
        </div>
        {loadingMedia ? (
          <div className="h-4 bg-muted rounded animate-pulse w-48"></div>
        ) : (
          <p className="text-sm text-muted-foreground text-center max-w-xs sm:max-w-sm md:max-w-md truncate">
            {mediaSpace?.media.name}
          </p>
        )}
      </div>

      {/* Sélecteur de mode de génération */}
      <GenerationModeSelector
        value={generationMode}
        onValueChange={handleModeChange}
        activeSpace={activeSpace}
      />

      {/* Contexte */}
      <div>
        <Label htmlFor="video-context" className="text-sm font-medium flex justify-between">
          <span>{t('enhancement-context')}</span>
          <span className="text-xs text-gray-500">{t('optional')}</span>
        </Label>
        <Textarea
          id="video-context"
          placeholder={t('enhancement-context-placeholder')}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="mt-1.5 min-h-[120px]"
        />
      </div>

      {/* Idées de mise en scène */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <Label className="text-sm font-medium">{t('staging-ideas-title')}</Label>
        </div>
        
        {loadingStagingIdeas ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-1/2"></div>
          </div>
        ) : stagingIdeas ? (
          <div className="flex flex-wrap gap-2">
            {stagingIdeas.map((idea, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer hover:bg-gray-200 hover:text-gray-800 transition-colors text-sm px-3 py-1"
                onClick={() => handleIdeaClick(idea)}
              >
                {idea}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">
            {t('staging-ideas-unavailable')}
          </div>
        )}
      </div>

      {/* Boutons */}
      <div className={`flex ${isModal ? 'gap-3' : 'flex-col gap-3'}`}>
        {onBack && (
          <Button 
            variant="outline"
            onClick={onBack}
            className={isModal ? 'flex-1' : 'w-full'}
          >
            {isModal ? t('dialog.close') : (
              <>
                <ArrowLeft className="h-4 w-4" />
                {t('back-to-assets')}
              </>
            )}
          </Button>
        )}

        <Button 
          onClick={handleGenerate} 
          disabled={generating || hasInsufficientCredits || hasReachedLimit || !activeSpace || !mediaSpace}
          className={isModal ? 'flex-1' : 'w-full'}
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('generating')}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t('generate-with-cost', { cost: selectedCost })}
            </>
          )}
        </Button>
      </div>

      {hasInsufficientCredits && (
        <p className="text-sm text-destructive text-center">
          {t('insufficient-credits-description')}
        </p>
      )}
      
      {hasReachedLimit && (
        <p className="text-sm text-destructive text-center">
          {t('generation-limit-reached-description')}
        </p>
      )}
    </div>
  )
} 