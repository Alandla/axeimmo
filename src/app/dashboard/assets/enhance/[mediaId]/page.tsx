'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/src/components/ui/button'
import { Textarea } from '@/src/components/ui/textarea'
import { Label } from '@/src/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Badge } from '@/src/components/ui/badge'
import { Loader2, Sparkles, ArrowLeft, Lightbulb } from 'lucide-react'
import { basicApiCall } from '@/src/lib/api'
import { useToast } from '@/src/hooks/use-toast'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import { IMediaSpace } from '@/src/types/space'
import Image from 'next/image'
import Link from 'next/link'
import SkeletonImage from '@/src/components/ui/skeleton-image'
import CameraMovementSelect from '@/src/components/ui/camera-movement-select'

interface StagingIdeasData {
  stagingIdeas: string[]
  recommendedCameraMovement: string
  cost: number
}

export default function EnhancePage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('assets')
  const { toast } = useToast()
  const { activeSpace } = useActiveSpaceStore()
  
  const [mediaSpace, setMediaSpace] = useState<IMediaSpace | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [context, setContext] = useState('')
  const [activeTab, setActiveTab] = useState('video')
  const [mediaNotFound, setMediaNotFound] = useState(false)
  
  // États pour les idées de mise en scène
  const [stagingIdeas, setStagingIdeas] = useState<string[] | null>(null)
  const [loadingStagingIdeas, setLoadingStagingIdeas] = useState(true)
  const [selectedCameraMovement, setSelectedCameraMovement] = useState<string>('Static')
  const [userChangedCameraMovement, setUserChangedCameraMovement] = useState(false)

  useEffect(() => {
    const fetchMediaAndStagingIdeas = async () => {
      if (!activeSpace?.id || !params.mediaId) return

      try {
        setLoading(true)
        setLoadingStagingIdeas(true)
        
        // Récupération du média
        const fetchedMediaSpace = await basicApiCall<IMediaSpace>('/media/get', {
          spaceId: activeSpace.id,
          mediaId: params.mediaId
        })
        setMediaSpace(fetchedMediaSpace)

        // Si c'est une image et qu'on est sur l'onglet vidéo, récupérer les idées de mise en scène
        if (fetchedMediaSpace?.media.type === 'image' && fetchedMediaSpace.media.image?.link && activeTab === 'video') {
          try {
            const stagingIdeasResult : any = await basicApiCall('/media/staging-ideas', {
              imageUrl: fetchedMediaSpace.media.image.link
            })

            console.log(stagingIdeasResult)
            setStagingIdeas(stagingIdeasResult.stagingIdeas)

            // Préfill du mouvement de caméra si l'utilisateur ne l'a pas changé
            if (!userChangedCameraMovement && stagingIdeasResult.recommendedCameraMovement) {
            setSelectedCameraMovement(stagingIdeasResult.recommendedCameraMovement)
            }
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
        } else {
          setLoadingStagingIdeas(false)
        }
      } catch (error) {
        console.error('Error fetching media:', error)
        setMediaNotFound(true)
        toast({
          title: t('toast.error'),
          description: 'Impossible de charger le média',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMediaAndStagingIdeas()
  }, [activeSpace?.id, params.mediaId])

  const handleCameraMovementChange = (value: string) => {
    setSelectedCameraMovement(value)
    setUserChangedCameraMovement(true)
  }

  const handleIdeaClick = (idea: string) => {
    const newContext = context ? `${context}\n${idea}` : idea
    setContext(newContext)
  }

  const handleGenerate = async () => {
    if (!mediaSpace || !activeSpace?.id) return

    setGenerating(true)

    try {
      toast({
        title: t('toast.generating'),
        description: activeTab === 'video' 
          ? t('toast.generating-video-description')
          : t('toast.generating-image-description'),
        variant: 'loading'
      })

      await basicApiCall('/media/enhance', {
        mediaSpace,
        spaceId: activeSpace.id,
        type: activeTab,
        context,
        cameraMovement: activeTab === 'video' ? selectedCameraMovement : undefined
      })

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

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
    <div className="flex flex-col items-center space-y-4 mb-8">
        <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-muted">
        {loading ? (
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
        {loading ? (
        <div className="h-4 bg-muted rounded animate-pulse w-48"></div>
        ) : (
        <p className="text-sm text-muted-foreground text-center">
            {mediaSpace?.media.name}
        </p>
        )}
    </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="video">{t('generate-video')}</TabsTrigger>
          <TabsTrigger value="image">{t('enhance-image')}</TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="space-y-4 mt-6">
          <div>
            <Label htmlFor="video-context" className="text-sm font-medium flex justify-between">
              <span>{t('enhancement-context')}</span>
              <span className="text-xs text-gray-500">{t('optional')}</span>
            </Label>
            <Textarea
              id="video-context"
              placeholder="Décrivez la vidéo que vous souhaitez créer à partir de cette image..."
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

          {/* Sélection du mouvement de caméra */}
          <CameraMovementSelect 
            value={selectedCameraMovement} 
            onChange={handleCameraMovementChange}
          />

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
              disabled={generating}
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
                  {t('generate-video')}
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="image" className="space-y-4 mt-6">
          <div>
            <Label htmlFor="image-context" className="text-sm font-medium flex justify-between">
              <span>{t('enhancement-context')}</span>
              <span className="text-xs text-gray-500">{t('optional')}</span>
            </Label>
            <Textarea
              id="image-context"
              placeholder="Décrivez comment vous souhaitez améliorer cette image..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="mt-1.5 min-h-[120px]"
            />
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
              disabled={generating}
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
                  {t('enhance-image')}
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 