'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { Palette } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import Image from 'next/image'
import type { AvatarStyle } from '@/src/types/avatar'

interface StyleSelectorProps {
  value: AvatarStyle
  onValueChange: (style: AvatarStyle) => void
  disabled?: boolean
  className?: string
  light?: boolean
  hiddenStyles?: AvatarStyle[]
}

const STYLE_PREVIEWS: Record<AvatarStyle, string> = {
  'ugc-realist': '/img/style-previews/ugc.png',
  'studio': '/img/style-previews/studio.png',
  'podcast': '/img/style-previews/podcast.png',
}

export function StyleSelector({ value, onValueChange, disabled, className, light = false, hiddenStyles = [] }: StyleSelectorProps) {
  const t = useTranslations('avatars.look-chat')

  const availableEntries = (Object.entries(STYLE_PREVIEWS) as [AvatarStyle, string][]) 
    .filter(([styleKey]) => !hiddenStyles.includes(styleKey))

  return (
    <Select
      value={value}
      onValueChange={(v) => onValueChange(v as AvatarStyle)}
      disabled={disabled}
    >
      <SelectTrigger
        variant={'ghost'}
        className={cn('w-auto px-2', light ? 'h-8' : 'h-9', className)}
        title={t('style')}
      >
        <SelectValue>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="text-sm">{t(`styles.${value}`)}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="min-w-[14rem]">
        {availableEntries.map(([styleKey, imageUrl]) => (
          <SelectItem key={styleKey} value={styleKey}>
            <div className="flex items-center gap-3">
              <Image
                src={imageUrl}
                alt={t(`styles.${styleKey}`)}
                className="h-10 w-10 rounded-md object-cover border"
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
              />
              <span className="text-sm">{t(`styles.${styleKey}`)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default StyleSelector
