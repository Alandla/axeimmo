'use client'

import { Check, Play, Pause } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import Image from 'next/image'

interface MusicProps {
  track: {
    id: string
    name: string
    url: string
    genre: string
    style: {
      rotate: number
      gradient: number
      hue: number
      saturation: number
    }
  }
  isSelected: boolean
  onSelect: (trackId: string) => void
  playingTrack: { track: any, audio: HTMLAudioElement | null }
  onPreviewTrack: (track: any) => void
  isMobile?: boolean
}

export default function Music({ track, isSelected, onSelect, playingTrack, onPreviewTrack, isMobile = false }: MusicProps) {
  const t = useTranslations('edit.audio')
  const isPlaying = playingTrack.track?.name === track.name

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPreviewTrack(track)
  }

  return (
    <Card 
      className={`flex flex-col relative cursor-pointer transition-all duration-150 ${isSelected ? 'border-primary border' : ''}`}
      onClick={() => onSelect(track.id)}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 transition-all duration-150">
          <Check className="h-5 w-5 text-gray-900" />
        </div>
      )}
      <CardContent className="p-4 flex flex-col h-full gap-4">
        <div className="flex gap-4">
          <div className={`relative w-16 h-16 shrink-0 overflow-hidden rounded-lg ${isMobile && 'hidden'}`}>
            <Image
              src={`/img/gradient/gradient-${track.style.gradient}.jpg`}
              alt=""
              width={256}
              height={256}
              className="object-cover"
              style={{
                filter: `hue-rotate(${track.style.hue}deg) saturate(${track.style.saturation}%)`,
                transform: `rotate(${track.style.rotate}deg) scale(1.3)`,
                width: '100%',
                height: '100%',
              }}
              priority
            />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h3 className="text-lg font-semibold truncate">{track.name}</h3>
            <Badge variant="secondary" className="w-fit mt-1">
              {t(`genres.${track.genre.toLowerCase()}`)}
            </Badge>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-auto"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              {t('pause')}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {t('listen')}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}