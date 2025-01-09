'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Save, X, Clock, Loader2, Info, Text, Sparkle, Sparkles, FileText } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { Separator } from './ui/separator'

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

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (mediaSpace) {
      setEditedName(mediaSpace.media.name)
      setEditedDescriptions(mediaSpace.media.description || [])
    }
  }, [mediaSpace])

  const handleSave = async () => {
    if (!mediaSpace || !activeSpace) return

    setIsSaving(true)

    if (editedName !== mediaSpace.media.name || editedDescriptions !== mediaSpace.media.description || autoPlacement !== mediaSpace.autoPlacement) {
      console.log('editedDescriptions', editedDescriptions)
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
          description: t('toast.error-description'),
          variant: 'destructive'
        })
      } finally {
        setIsSaving(false)
      }
    }
  }

  const updateDescription = (index: number, field: keyof Description, value: string | number) => {
    if (!mediaSpace) return

    const newDescriptions = [...(mediaSpace.media.description || [])]
    newDescriptions[index] = {
      ...newDescriptions[index],
      [field]: value
    }
    setEditedDescriptions(newDescriptions)
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
          <div className="pr-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
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

            <p className="text-sm text-muted-foreground mt-2">
              {t('dialog.added-by', { 
                name: mediaSpace.creator.name || t('dialog.unknown-user'),
                date: uploadDate
              })}
            </p>

            <Separator className="my-8" />

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
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Text className="h-3 w-3" />
                  {t(mediaSpace.media.description?.length === 1 ? 'dialog.description' : 'dialog.descriptions')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('dialog.tooltip-description')}
                </p>
              </div>

              {mediaSpace.media.description?.length === 1 ? (
                <div className="mt-2">
                  <Textarea
                    value={editedDescriptions[0]?.text || ''}
                    onChange={(e) => updateDescription(0, 'text', e.target.value)}
                    className="min-h-[100px]"
                  />
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
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>

        <div className="flex pt-4 border-t gap-2">
          <Button onClick={handleSave} disabled={isSaving}>
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