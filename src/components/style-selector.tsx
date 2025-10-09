'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Palette, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { createPortal } from 'react-dom'

type AvatarStyle = 'ugc-realist' | 'studio' | 'podcast'

interface StyleSelectorProps {
  value: AvatarStyle
  onValueChange: (style: AvatarStyle) => void
  disabled?: boolean
  className?: string
  light?: boolean
  // Optionally hide specific styles from the picker UI
  hiddenStyles?: AvatarStyle[]
}

// Mock images for style previews - these would typically come from your assets
const STYLE_PREVIEWS = {
  'ugc-realist': '/img/style-previews/ugc.png',
  'studio': '/img/style-previews/studio.png', 
  'podcast': '/img/style-previews/podcast.png'
}

export function StyleSelector({ value, onValueChange, disabled, className, light = false, hiddenStyles = [] }: StyleSelectorProps) {
  const t = useTranslations('avatars.look-chat')
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState<{ left: number; bottom: number }>({ left: 0, bottom: 0 })
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // Close picker when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      const pickerElement = document.querySelector('[data-style-picker-menu]')
      const buttonElement = buttonRef.current

      if (
        pickerElement && 
        !pickerElement.contains(target) && 
        buttonElement && 
        !buttonElement.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleButtonClick = () => {
    if (disabled) return
    
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      setCoords({ left: rect.left, bottom: window.innerHeight - rect.top + 8 })
    }
    setIsOpen((prev) => !prev)
  }

  const handleStyleSelect = (style: AvatarStyle) => {
    onValueChange(style)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        ref={buttonRef}
        onClick={handleButtonClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 px-2 rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none",
          light ? "h-8" : "h-9"
        )}
        title={t('style')}
      >
        <Palette className="h-4 w-4" />
        <span className="text-sm">
          {t(`styles.${value}`)}
        </span>
        <ChevronsUpDown className="h-4 w-4" />
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          data-style-picker-menu
          className="fixed inline-block bg-white border rounded-2xl shadow-2xl p-3 z-[9999] pointer-events-auto" 
          style={{ left: coords.left, bottom: coords.bottom }}
        >
          <div className="flex flex-wrap items-start gap-3">
            {Object.entries(STYLE_PREVIEWS)
              .filter(([styleKey]) => !hiddenStyles.includes(styleKey as AvatarStyle))
              .map(([styleKey, imageUrl]) => (
              <button
                key={styleKey}
                type="button"
                className="relative h-28 w-28 rounded-xl overflow-hidden border bg-white flex-shrink-0 cursor-pointer"
                onClick={() => handleStyleSelect(styleKey as AvatarStyle)}
                title={t(`styles.${styleKey}`)}
              >
                <img 
                  src={imageUrl} 
                  alt={t(`styles.${styleKey}`)} 
                  className="h-full w-full object-cover" 
                />
                {value === styleKey && (
                  <>
                    <span className="absolute inset-0 bg-black/50" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </span>
                  </>
                )}
                {/* Bottom gradient for legibility */}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="pointer-events-none absolute bottom-1 left-2 z-10 text-white text-xs leading-none">
                  {t(`styles.${styleKey}`)}
                </span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default StyleSelector
