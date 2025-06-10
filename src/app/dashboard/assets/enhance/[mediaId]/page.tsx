'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
import Link from 'next/link'
import { GenerationModeSelector } from '@/src/components/ui/generation-mode-selector'
import { KlingGenerationMode, KLING_GENERATION_COSTS } from '@/src/lib/fal'
import { PlanName } from '@/src/types/enums'
import { usePremiumToast } from '@/src/utils/premium-toast'
import SkeletonImage from '@/src/components/ui/skeleton-image'

interface StagingIdeasData {
  stagingIdeas: string[]
  recommendedCameraMovement: string
  cost: number
}

export default function EnhancePage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('assets')
  const planT = useTranslations('plan')
  const pricingT = useTranslations('pricing')
  const { toast } = useToast()
  const { activeSpace } = useActiveSpaceStore()
  const { decrementCredits, incrementImageToVideoUsage } = useActiveSpaceStore()
  const { showPremiumToast } = usePremiumToast()
  
  const [mediaSpace, setMediaSpace] = useState<IMediaSpace | null>(null)
  const [loadingMedia, setLoadingMedia] = useState(true)
  const [loadingStagingIdeas, setLoadingStagingIdeas] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [context, setContext] = useState('')
  const [mediaNotFound, setMediaNotFound] = useState(false)
  const [generationMode, setGenerationMode] = useState<KlingGenerationMode>(KlingGenerationMode.STANDARD)
  
  // États pour les idées de mise en scène
  const [stagingIdeas, setStagingIdeas] = useState<string[] | null>(null)

  useEffect(() => {
    const fetchMediaAndStagingIdeas = async () => {
      if (!activeSpace?.id || !params.mediaId) return

      try {
        setLoadingMedia(true)
        
        // Récupération du média
        const fetchedMediaSpace = await basicApiCall<IMediaSpace>('/media/get', {
          spaceId: activeSpace.id,
          mediaId: params.mediaId
        })
        setMediaSpace(fetchedMediaSpace)

        setLoadingMedia(false)

        // Si c'est une image, récupérer les idées de mise en scène
        if (fetchedMediaSpace?.media.type === 'image' && fetchedMediaSpace.media.image?.link) {
          try {
            const stagingIdeasResult : any = await basicApiCall('/media/staging-ideas', {
              imageUrl: fetchedMediaSpace.media.image.link
            })

            console.log(stagingIdeasResult)
            setStagingIdeas(stagingIdeasResult.stagingIdeas)
          } catch (stagingError) {
            console.error('Error fetching staging ideas:', stagingError)
            toast({
              title: t('toast.error'),
              description: 'Impossible de récupérer les idées de mise en scène',
              variant: 'destructive'
            })
          } finally {
            setLoadingStagingIdeas(false)
          }
        }
      } catch (error) {
        console.error('Error fetching media:', error)
        setMediaNotFound(true)
        toast({
          title: t('toast.error'),
          description: 'Impossible de charger le média',
          variant: 'destructive'
        })
      }
    }

    fetchMediaAndStagingIdeas()
  }, [activeSpace?.id, params.mediaId])

  const handleIdeaClick = (idea: string) => {
    const newContext = context ? `${context}\n${idea}` : idea
    setContext(newContext)
  }

  const handleModeChange = (value: string) => {
    const mode = value as KlingGenerationMode
    
    // Vérifier si l'utilisateur a accès au mode Ultra (PRO)
    if (mode === KlingGenerationMode.PRO && activeSpace?.planName !== PlanName.ENTREPRISE) {
      showPremiumToast(
        t('toast.title-error'),
        pricingT('premium-toast.description', { plan: planT(PlanName.ENTREPRISE) }),
        pricingT('upgrade')
      );
      return
    }
    
    setGenerationMode(mode)
  }

  const handleGenerate = async () => {
    if (!mediaSpace || !activeSpace?.id) return

    const selectedCost = KLING_GENERATION_COSTS[generationMode]
    
    // Vérifier les crédits
    if (activeSpace.credits < selectedCost) {
      toast({
        title: t('insufficient-credits'),
        description: t('insufficient-credits-description'),
        variant: 'destructive'
      })
      return
    }

    // Vérifier la limite de génération pour les plans non-entreprise
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

      await basicApiCall('/media/enhance', {
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

      router.push('/dashboard/assets')
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

  if (mediaNotFound) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Média introuvable</p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/assets">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back-to-assets')}
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const selectedCost = KLING_GENERATION_COSTS[generationMode]
  const hasInsufficientCredits = activeSpace ? activeSpace.credits < selectedCost : false
  const remainingGenerations = activeSpace ? (activeSpace.imageToVideoLimit || 0) - (activeSpace.imageToVideoUsed || 0) : 0
  const hasReachedLimit = activeSpace && activeSpace?.planName !== PlanName.ENTREPRISE && remainingGenerations <= 0

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* Header */}
      <div className="flex flex-col items-center space-y-2 mb-8">
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

      <div className="space-y-4">
        {/* Sélecteur de mode de génération */}
        <GenerationModeSelector
          value={generationMode}
          onValueChange={handleModeChange}
          activeSpace={activeSpace}
        />

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

        {/* Idées de mise en scène de l'IA */}
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

        <div className="flex flex-col gap-3">
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/assets')}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('back-to-assets')}
          </Button>

          <Button 
            onClick={handleGenerate} 
            disabled={generating || hasInsufficientCredits || hasReachedLimit || !activeSpace}
            className="w-full"
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
      </div>
    </div>
  )
} 