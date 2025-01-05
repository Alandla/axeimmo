'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Save, X, Clock } from 'lucide-react'
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

interface AssetDialogProps {
  mediaSpace: MediaSpaceWithCreator | null
  open: boolean
  onClose: () => void
}

type Description = {
  start: number
  duration?: number
  text: string
}

export default function AssetDialog({ mediaSpace, open, onClose }: AssetDialogProps) {
  const t = useTranslations('assets')
  const { toast } = useToast()
  const { data: session } = useSession()

  const [name, setName] = useState(mediaSpace?.media.name || '')
  const [descriptions, setDescriptions] = useState<Description[]>(
    mediaSpace?.media.description || []
  )

  useEffect(() => {
    if (mediaSpace) {
      setName(mediaSpace.media.name)
      setDescriptions(mediaSpace.media.description || [])
    }
  }, [mediaSpace])

  const handleSave = async () => {
    if (!mediaSpace) return

    try {
      await basicApiCall('/media/update', {
        mediaId: mediaSpace.media.id,
        updates: {
          name,
          description: descriptions
        }
      })

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
    }
  }

  const updateDescription = (index: number, field: keyof Description, value: string | number) => {
    const newDescriptions = [...descriptions]
    newDescriptions[index] = {
      ...newDescriptions[index],
      [field]: value
    }
    setDescriptions(newDescriptions)
  }

  if (!mediaSpace) return null

  const { media, creator } = mediaSpace
  const mediaUrl = media.type === 'video' ? media.video?.link : media.image?.link
  const thumbnail = media.image?.link
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
        className="w-[90vw] sm:max-w-[600px] rounded-lg">
        <SheetHeader>
            <SheetTitle>{t('dialog.title')}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-8rem)] overflow-y-auto mt-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
            {media.type === 'video' && mediaUrl ? (
              <video
                src={mediaUrl}
                controls
                className="w-full h-full object-contain"
              />
            ) : thumbnail ? (
              <Image
                src={thumbnail}
                alt={name}
                layout="fill"
                objectFit="contain"
                priority
              />
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            {t('dialog.added-by', { 
              name: creator.name || t('dialog.unknown-user'),
              date: uploadDate
            })}
          </p>

          <div className="mt-4">
            <Label htmlFor="name">{t('dialog.name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="mt-6">
            <Label>{t(descriptions.length === 1 ? 'dialog.description' : 'dialog.descriptions')}</Label>
            
            {descriptions.length > 1 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {descriptions.map((desc, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(desc.start)}
                    {desc.duration && ` - ${formatTime(desc.start + desc.duration)}`}
                  </Badge>
                ))}
              </div>
            )}

            {descriptions.length === 1 ? (
              <div className="mt-2">
                <Textarea
                  value={descriptions[0].text}
                  onChange={(e) => updateDescription(0, 'text', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            ) : (
              descriptions.map((desc, index) => (
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
                    className="min-h-[100px]"
                  />
                </div>
              ))
            )}
          </div>

          <div className="flex mt-8 sticky bottom-0 bg-background py-4 border-t gap-2">
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              {t('dialog.save')}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {t('dialog.close')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 