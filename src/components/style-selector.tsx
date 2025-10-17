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
import { AVATAR_STYLES } from '@/src/config/avatarStyles.config'

interface StyleSelectorProps {
  value: AvatarStyle
  onValueChange: (style: AvatarStyle) => void
  disabled?: boolean
  className?: string
  light?: boolean
  hiddenStyles?: AvatarStyle[]
}

export function StyleSelector({ value, onValueChange, disabled, className, light = false, hiddenStyles = [] }: StyleSelectorProps) {
  const t = useTranslations('avatars.look-chat')

  const availableStyles = Object.values(AVATAR_STYLES)
    .filter(style => !hiddenStyles.includes(style.key))

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
        {availableStyles.map((style) => (
          <SelectItem key={style.key} value={style.key}>
            <div className="flex items-center gap-3">
              <Image
                src={style.previewImage}
                alt={t(`styles.${style.key}`)}
                className="h-10 w-10 rounded-md object-cover border"
                width={40}
                height={40}
                loading="lazy"
                decoding="async"
              />
              <span className="text-sm">{t(`styles.${style.key}`)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default StyleSelector
