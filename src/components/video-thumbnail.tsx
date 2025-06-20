'use client'

import Image from 'next/image'
import { VideoIcon, FileImage, User } from 'lucide-react'
import { IVideo, VIDEO_FORMATS } from '@/src/types/video'
import SkeletonImage from './ui/skeleton-image'
import SkeletonVideoFrame from './ui/skeleton-video-frame'
import { cn } from '@/src/lib/utils'

interface VideoThumbnailProps {
  video: IVideo
  className?: string
  alt?: string
}

export default function VideoThumbnail({ video, className, alt }: VideoThumbnailProps) {
  // Si on a déjà une thumbnail, on l'utilise directement
  if (video.video?.thumbnail) {
    return (
      <div className={cn("relative w-full h-full", className)}>
        <div className="absolute inset-0 bg-black/90">
          <Image
            src={video.video.thumbnail}
            alt={alt || ""}
            layout="fill"
            objectFit="cover"
            priority
            className="blur-md scale-110"
          />
        </div>
        <Image
          src={video.video.thumbnail}
          alt={alt || ""}
          layout="fill"
          objectFit="contain"
          priority
          className="relative z-10"
        />
      </div>
    )
  }

  // Sinon on génère une thumbnail basée sur la première séquence
  const firstSequence = video.video?.sequences?.[0]
  const avatar = video.video?.avatar
  const format = video.video?.format || 'vertical'
  
  // Récupérer les dimensions du format
  const formatConfig = VIDEO_FORMATS.find(f => f.value === format)
  const aspectRatio = formatConfig ? formatConfig.width / formatConfig.height : 9/16

  if (!firstSequence) {
    // Fallback : icône générique avec le bon format
    return (
      <div className={cn("relative w-full h-full", className)}>
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          style={{ 
            aspectRatio: aspectRatio,
            width: aspectRatio > 1 ? '100%' : 'auto',
            height: aspectRatio <= 1 ? '100%' : 'auto'
          }}
        >
          <VideoIcon className="w-12 h-12 text-gray-400" />
        </div>
      </div>
    )
  }

  const media = firstSequence.media

  // Fonction pour générer le contenu avec le bon format
  const generateFormattedThumbnail = (content: React.ReactNode, backgroundContent?: React.ReactNode) => {
    return (
      <div className={cn("relative w-full h-full", className)}>
        {/* Arrière-plan flouté */}
        {backgroundContent && (
          <div className="absolute inset-0 bg-black/90">
            <div className="w-full h-full scale-110 blur-md">
              {backgroundContent}
            </div>
          </div>
        )}
        
        {/* Contenu principal avec le bon format */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 overflow-hidden"
          style={{ 
            aspectRatio: aspectRatio,
            width: aspectRatio > 1 ? '100%' : 'auto',
            height: aspectRatio <= 1 ? '100%' : 'auto'
          }}
        >
          {content}
        </div>
      </div>
    )
  }

  // Si le media est en mode 'hide', on affiche uniquement l'avatar
  if (media?.show === 'hide' && avatar?.thumbnail) {
    const avatarContent = (
      <SkeletonImage
        src={avatar.thumbnail}
        height={1200}
        width={630}
        alt="Avatar"
        className="w-full h-full object-cover"
      />
    )
    return generateFormattedThumbnail(avatarContent, avatarContent)
  }

  // Si le media est en mode 'half', on affiche moitié media / moitié avatar
  if (media?.show === 'half' && avatar?.thumbnail) {
    const halfContent = (
      <div className="w-full h-full relative">
        <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden">
          {renderMediaThumbnail(media)}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 overflow-hidden">
          <SkeletonImage
            src={avatar.thumbnail}
            height={600}
            width={315}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    )
    
    const backgroundContent = renderMediaThumbnail(media)
    return generateFormattedThumbnail(halfContent, backgroundContent)
  }

  // Sinon on affiche la thumbnail du media
  if (media) {
    const mediaContent = renderMediaThumbnail(media)
    return generateFormattedThumbnail(mediaContent, mediaContent)
  }

  // Fallback final : icône générique
  return (
    <div className={cn("relative w-full h-full", className)}>
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{ 
          aspectRatio: aspectRatio,
          width: aspectRatio > 1 ? '100%' : 'auto',
          height: aspectRatio <= 1 ? '100%' : 'auto'
        }}
      >
        <VideoIcon className="w-12 h-12 text-gray-400" />
      </div>
    </div>
  )
}

function renderMediaThumbnail(media: any) {
  // Si c'est une image, on l'utilise directement
  if (media.image) {
    return (
      <SkeletonImage
        src={media.image.link}
        height={1200}
        width={630}
        alt=""
        className="w-full h-full object-cover"
      />
    )
  }

  // Si c'est une vidéo
  if (media.type === 'video' && media.video?.link) {
    // Si on a des frames, on utilise la première
    if (media.video.frames && media.video.frames.length > 0) {
      return (
        <SkeletonImage
          src={media.video.frames[0]}
          height={1200}
          width={630}
          alt=""
          className="w-full h-full object-cover"
        />
      )
    }
    
    // Sinon on utilise SkeletonVideoFrame
    return (
      <SkeletonVideoFrame
        srcVideo={media.video.link}
        className="w-full h-full object-cover"
        startAt={media.startAt || 0}
      />
    )
  }

  // Fallback : icône selon le type
  return (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
      {media.type === 'video' ? (
        <VideoIcon className="text-gray-400 text-3xl" />
      ) : (
        <FileImage className="text-gray-400 text-3xl" />
      )}
    </div>
  )
} 