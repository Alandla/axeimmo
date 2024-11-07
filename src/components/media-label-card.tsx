'use client'

import React from 'react'
import { Card, CardContent } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { Image, Video } from "lucide-react"
import { useTranslations } from 'next-intl'

interface MediaLabelCardProps {
  mediaUrl: string
  index: number
  mediaType: 'image' | 'video'
  label?: string
  onLabelChange: (label: string) => void
  onTabPress?: () => void
  textareaRef?: React.RefObject<HTMLTextAreaElement>
}

export function MediaLabelCard({ 
  mediaUrl, 
  index, 
  mediaType, 
  label = '', 
  onLabelChange,
  onTabPress,
  textareaRef 
}: MediaLabelCardProps) {
  const t = useTranslations('media')

  return (
    <Card className="flex flex-col relative">
      <CardContent className="flex flex-col justify-between p-4 h-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Media {index + 1}</h3>
          {mediaType === 'image' ? (
            <Image className="w-5 h-5 text-gray-500" />
          ) : (
            <Video className="w-5 h-5 text-gray-500" />
          )}
        </div>
        <div className="w-full aspect-square rounded-md overflow-hidden mb-4">
          {mediaType === 'image' ? (
            <img src={mediaUrl} alt={`Media ${index + 1}`} className="w-full h-full object-cover" />
          ) : (
            <video src={mediaUrl} controls className="w-full h-full object-cover" />
          )}
        </div>
        <Textarea
          ref={textareaRef}
          placeholder={t('describe_placeholder')}
          className="min-h-[100px] resize-none"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault()
              onTabPress?.()
            }
          }}
        />
      </CardContent>
    </Card>
  )
}
