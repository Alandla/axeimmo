'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Save, X, Clock, Loader2, Text, FileText, Sparkles, Wand2, Download } from 'lucide-react'
import { useToast } from '@/src/hooks/use-toast'
import { basicApiCall } from '@/src/lib/api'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet'
import { MediaSpaceWithCreator } from '../app/dashboard/assets/page'
import { useSession } from 'next-auth/react'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { ScrollArea } from './ui/scroll-area'
import { useActiveSpaceStore } from '@/src/store/activeSpaceStore'
import { Switch } from './ui/switch'
import { TextShimmer } from './ui/text-shimmer'
import { IMediaSpace } from '@/src/types/space'

interface AssetDialogProps {
  mediaSpace: MediaSpaceWithCreator | null
  setMedia: (media: MediaSpaceWithCreator) => void
  open: boolean
  onClose: () => void
}

type Description = {
  start: number
  duration?: number
  text: string
}

export default function AssetDialog({ mediaSpace, setMedia, open, onClose }: AssetDialogProps) {
  const t = useTranslations('assets')
  const { toast } = useToast()
  const { data: session } = useSession()
  const { activeSpace } = useActiveSpaceStore()
  const [editedName, setEditedName] = useState(mediaSpace?.media.name || '')
  const [editedDescriptions, setEditedDescriptions] = useState<Description[]>(mediaSpace?.media.description || [])
  const [autoPlacement, setAutoPlacement] = useState(mediaSpace?.autoPlacement ?? true)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour récupérer la description du média depuis l'API
  const fetchMediaDescription = async () => {
    if (!activeSpace?.id || !mediaSpace?.id || !open) return;
    
    try {
      const fetchedMediaSpace = await basicApiCall<IMediaSpace>('/media/get', {
        spaceId: activeSpace.id,
        mediaId: mediaSpace.id
      });

      const hasDescription = fetchedMediaSpace.media.description && 
                            fetchedMediaSpace.media.description.length > 0 && 
                            fetchedMediaSpace.media.description[0].text !== "";
      
      if (hasDescription) {
        setEditedDescriptions(fetchedMediaSpace.media.description || []);
        setIsGeneratingDescription(false);

        setMedia({
          ...mediaSpace,
          media: {
            ...mediaSpace.media,
            description: fetchedMediaSpace.media.description
          }
        });
        
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        toast({
          title: t('toast.description-generated'),
          description: t('toast.description-generated-description'),
          variant: 'confirm'
        });
      }
    } catch (error) {
      console.error('Error fetching media description:', error);
    }
  };

  useEffect(() => {
    if (!open && pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      return;
    }
    
    if (!mediaSpace) return;
    
    setEditedName(mediaSpace.media.name);
    setEditedDescriptions(mediaSpace.media.description || []);
    setAutoPlacement(mediaSpace.autoPlacement ?? true);

    const isRecentlyAdded = mediaSpace.uploadedAt && 
      (new Date().getTime() - new Date(mediaSpace.uploadedAt).getTime()) < 2 * 60 * 1000; // 2 minutes
    
    const hasEmptyDescription = mediaSpace.media.description && 
      mediaSpace.media.description.length > 0 && 
      mediaSpace.media.description[0].text === "";
    
    const isGenerating = Boolean(isRecentlyAdded && hasEmptyDescription);
    setIsGeneratingDescription(isGenerating);
    
    if (isGenerating && open) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      
      pollingIntervalRef.current = setInterval(fetchMediaDescription, 2000);
      
      fetchMediaDescription();
    } else if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [mediaSpace, open]);

  const handleSave = async () => {
    if (!mediaSpace || !activeSpace) return

    setIsSaving(true)

    console.log(editedName !== mediaSpace.media.name || editedDescriptions !== mediaSpace.media.description || autoPlacement !== mediaSpace.autoPlacement)

    if (editedName !== mediaSpace.media.name || editedDescriptions !== mediaSpace.media.description || autoPlacement !== mediaSpace.autoPlacement) {
      try {
        const updatedSpaceMedia = {
            ...mediaSpace,
            media: {
              ...mediaSpace.media,
              name: editedName,
              description: editedDescriptions
            },
            autoPlacement
        }

        await basicApiCall('/media/update', {
          spaceId: activeSpace.id,
          mediaSpace: updatedSpaceMedia
        })
        
        setMedia(updatedSpaceMedia as MediaSpaceWithCreator)

        toast({
          title: t('toast.saved'),
          description: t('toast.saved-description'),
          variant: 'confirm'
        })

        onClose()
      } catch (error) {
        console.error('Error saving media:', error)
        toast({
          title: t('toast.error'),
          description: t('toast.error-saved-description'),
          variant: 'destructive'
        })
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleGenerateDescription = async () => {
    if (!mediaSpace || !activeSpace?.id) return
    
    setIsGeneratingDescription(true)
    
    try {
      toast({
        title: t('toast.generating'),
        description: t('toast.generating-description'),
        variant: 'loading'
      })

      await basicApiCall('/media/analyze', {
        media: mediaSpace,
        spaceId: activeSpace.id
      })
      
      // Commencer le polling pour récupérer la description générée
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      
      pollingIntervalRef.current = setInterval(fetchMediaDescription, 2000);
      
    } catch (error) {
      console.error('Error generating description:', error)
      toast({
        title: t('toast.error'),
        description: t('toast.generation-error-description'),
        variant: 'destructive'
      })
      setIsGeneratingDescription(false)
    }
  }

  const updateDescription = (index: number, field: keyof Description, value: string | number) => {
    if (!mediaSpace) return

    const newDescriptions = [...editedDescriptions]
    newDescriptions[index] = {
      ...newDescriptions[index],
      [field]: value
    }
    setEditedDescriptions(newDescriptions)
  }

  const shouldShowGenerateButton = () => {
    // Conditions de base
    if (!mediaSpace || isGeneratingDescription) return false

    // Vérifier si le média a été uploadé il y a plus de 2 minutes
    const isOlderThanTwoMinutes = mediaSpace.uploadedAt && 
      (new Date().getTime() - new Date(mediaSpace.uploadedAt).getTime()) > 2 * 60 * 1000
    
    if (!isOlderThanTwoMinutes) return false

    // Vérifier si le média n'a pas de description ou si la description est vide
    const descriptions = mediaSpace.media.description || []
    
    // S'il n'y a pas de descriptions ou si le tableau est vide
    if (descriptions.length === 0) return true
    
    // S'il y a une description mais qu'elle est vide
    return descriptions[0]?.text === ""
  }

  if (!mediaSpace) return null

  const uploadDate = mediaSpace.uploadedAt ? new Date(mediaSpace.uploadedAt).toLocaleDateString(
    session?.user?.options?.lang === 'en' ? 'en-US' : 'fr-FR',
    { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  ) : ''

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent 
        side="right"
        className="w-[90vw] sm:max-w-[600px] rounded-lg flex flex-col">
        <SheetHeader>
            <SheetTitle>{t('dialog.title')}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <div className="absolute top-2 right-2 z-10">
                <Button 
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => {
                    const url = mediaSpace.media.type === 'video' 
                      ? mediaSpace.media.video?.link 
                      : mediaSpace.media.image?.link;
                      
                    if (url) {
                      window.open(url, '_blank');
                    }
                  }}
                >
                  <Download size={16} />
                </Button>
              </div>
              {mediaSpace.media.type === 'video' ? (
                <video
                    src={mediaSpace.media.video?.link}
                    controls
                    className="w-full h-full object-contain"
                />
              ) : mediaSpace.media.type === 'image' ? (
                <Image
                  src={mediaSpace.media.image?.link || ''}
                  alt={mediaSpace.media.name}
                  layout="fill"
                  objectFit="contain"
                  priority
                />
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground mt-2 mb-4">
              {t('dialog.added-by', { 
                name: mediaSpace.creator.name || t('dialog.unknown-user'),
                date: uploadDate
              })}
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {t('dialog.name')}
                </Label>
                <Input
                  id="name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-placement" className="text-sm font-medium flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {t('dialog.automatic-placement')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('dialog.automatic-placement-description')}
                  </p>
                </div>
                <Switch
                  id="auto-placement"
                  checked={autoPlacement}
                  onCheckedChange={setAutoPlacement}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="space-y-0.5">
                <div>
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Text className="h-3 w-3" />
                    {t(mediaSpace.media.description?.length === 1 ? 'dialog.description' : 'dialog.descriptions')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('dialog.tooltip-description')}
                  </p>
                </div>
              </div>

              {mediaSpace.media.description?.length === 1 ? (
                <div className="mt-2 relative">
                  <Textarea
                    value={editedDescriptions[0]?.text || ''}
                    onChange={(e) => updateDescription(0, 'text', e.target.value)}
                    className="min-h-[140px]"
                    disabled={isGeneratingDescription}
                  />
                  {isGeneratingDescription && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-md">
                      <TextShimmer
                        as="p" 
                        className="font-medium text-sm" 
                        duration={2}
                        spread={2}
                      >
                        AI is generating a description for this media... Please wait.
                      </TextShimmer>
                    </div>
                  )}
                  {shouldShowGenerateButton() && (
                    <div className="flex justify-end mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleGenerateDescription}
                        className="h-8"
                      >
                        <Wand2 size={12} />
                        {t('dialog.generate-description')}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                editedDescriptions.map((desc, index) => (
                  <div key={index} className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(desc.start)}
                        {desc.duration && ` - ${formatTime(desc.start + desc.duration)}`}
                      </Badge>
                    </div>
                    <Textarea
                      value={desc.text}
                      onChange={(e) => updateDescription(index, 'text', e.target.value)}
                      className="min-h-[70px]"
                      disabled={isGeneratingDescription}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex pt-4 border-t gap-2">
          <Button onClick={handleSave} disabled={isSaving || isGeneratingDescription}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t('dialog.save')}
          </Button>
          <Button variant="outline" onClick={onClose}>
            {t('dialog.close')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
} 