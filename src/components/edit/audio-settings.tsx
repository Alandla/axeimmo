'use client'

import { useTranslations } from 'next-intl'
import { CardContent, CardHeader, CardTitle } from '../ui/card'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { Slider } from '../ui/slider'

interface AudioProps {
  video: any
  updateAudioSettings: (settings: any) => void
}

export default function AudioSettings({ video, updateAudioSettings }: AudioProps) {
  const t = useTranslations('edit.audio')

  const handleVolumeChange = (value: number[]) => {
    updateAudioSettings({ 
      ...video?.video?.audio,
      volume: value[0]
    })
  }

  const handleVolumeMusicChange = (value: number[]) => {
    updateAudioSettings({ 
      ...video?.video?.audio,
      music: {
        ...video?.video?.audio?.music,
        volume: value[0]
      }
    })
  }

  return (
    <>
        <CardHeader className="p-2 sm:p-6">
            <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-2 pt-0 sm:p-6 sm:pt-0">
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2 min-w-20">
            {video?.video?.audio?.volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : video?.video?.audio?.volume < 0.5 ? (
              <Volume1 className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            {t('volume-voice-title')}
          </span>
          <div className="flex items-center gap-2">
            <Slider
              value={[video?.video?.audio?.volume ?? 1]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value: number[]) => handleVolumeChange(value)}
              className="w-32"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={Math.round((video?.video?.audio?.volume ?? 1) * 100)}
              onChange={(e) => {
                const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                handleVolumeChange([value / 100])
              }}
              className="w-16 h-8 text-sm text-center rounded-md border"
            />
          </div>
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="flex items-center gap-2 min-w-20">
            {video?.video?.audio?.music?.volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : video?.video?.audio?.music?.volume < 0.5 ? (
              <Volume1 className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            {t('volume-music-title')}
          </span>
          <div className="flex items-center gap-2">
            <Slider
              value={[video?.video?.audio?.music?.volume ?? 1]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(value: number[]) => handleVolumeMusicChange(value)}
              className="w-32"
            />
            <input
              type="number"
              min="0"
              max="100"
              value={Math.round((video?.video?.audio?.music?.volume ?? 1) * 100)}
              onChange={(e) => {
                const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0))
                handleVolumeMusicChange([value / 100])
              }}
              className="w-16 h-8 text-sm text-center rounded-md border"
            />
          </div>
        </div>
        </CardContent>
    </>
  )
}