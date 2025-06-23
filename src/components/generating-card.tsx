'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Loader2, Video, Image as ImageIcon, Clock } from 'lucide-react'
import { Badge } from './ui/badge'
import { useSession } from 'next-auth/react'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { IMediaSpace } from '../types/space'

interface GeneratingCardProps {
  mediaSpace: IMediaSpace
}

export default function GeneratingCard({ mediaSpace }: GeneratingCardProps) {
  const t = useTranslations('assets')
  const { data: session } = useSession()
  
  const isVideoGeneration = mediaSpace.media.generationStatus === 'generating-video'
  const isImageGeneration = mediaSpace.media.generationStatus === 'generating-image'
  
  // Récupérer le media de base pour l'affichage
  const baseMedia = mediaSpace.media

  return (
    <div className="group relative bg-card overflow-hidden">
      {/* Media preview with blur effect */}
      <div className="relative aspect-video overflow-hidden bg-muted rounded-lg">
        {baseMedia.type === 'video' ? (
          <div className="relative w-full h-full">
            {baseMedia.video?.frames && baseMedia.video.frames.length > 0 ? (
              <Image
                src={baseMedia.video.frames[0]}
                alt={baseMedia.name}
                fill
                className="object-cover filter blur-sm"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center filter blur-sm">
                <Video className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
        ) : baseMedia.type === 'image' ? (
          <Image
            src={baseMedia.image?.link || ''}
            alt={baseMedia.name}
            fill
            className="object-cover filter blur-sm"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center filter blur-sm">
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Generation overlay */}
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
            
            <div className="space-y-1">
              <p className="text-white font-medium text-sm">
                {isVideoGeneration ? t('generating-video') : t('generating-image')}
              </p>
              <div className="flex items-center justify-center gap-1 text-white/80 text-xs">
                <Clock className="h-3 w-3" />
                <span>{t('processing')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Generation type badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            {isVideoGeneration ? (
              <>
                <Video className="h-3 w-3" />
                Video
              </>
            ) : (
              <>
                <ImageIcon className="h-3 w-3" />
                Image
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Media info */}
      <div className="mt-2 flex justify-between items-start space-x-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">
            {baseMedia.name}
          </h3>
          <p className="text-sm text-gray-500 truncate">
            {formatDistanceToNow(mediaSpace.uploadedAt ? new Date(mediaSpace.uploadedAt) : new Date(), { 
              addSuffix: true, 
              locale: session?.user?.options?.lang === 'en' ? enUS : fr 
            })}
          </p>
        </div>
      </div>
    </div>
  )
} 