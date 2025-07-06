'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { IMediaSpace } from '@/src/types/space'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

interface GeneratingMediaItemProps {
  mediaSpace: IMediaSpace
}

const GeneratingMediaItem: React.FC<GeneratingMediaItemProps> = ({ 
  mediaSpace,
}) => {
  const t = useTranslations('assets')
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth > 768)

  const container = {
    hidden: {},
    visible: {}
  }

  const itemAnimation = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.25 } }
  }

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth > 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <motion.div 
      className="group relative overflow-hidden break-inside-avoid"
      variants={container}
      initial={isLargeScreen ? "hidden" : "visible"}
      whileHover={isLargeScreen ? "visible" : ""}
    >
      {/* Gradient background au hover */}
      {mediaSpace.media.name && (
        <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-1/4 bg-gradient-to-t from-black to-transparent rounded-lg z-10"></div>
      )}

      {/* Image source avec opacité */}
      {mediaSpace.media.image?.link && (
        <div className="relative w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={mediaSpace.media.image?.link || ''}
            alt={mediaSpace.media.name}
            width={mediaSpace.media.image?.width || 100}
            height={mediaSpace.media.image?.height || 100}
            className="w-full h-fit rounded-md object-cover opacity-40"
            unoptimized
          />
          {/* Overlay noir */}
          <div className="absolute inset-0 bg-black/50 rounded-md"></div>
        </div>
      )}

      {/* Éléments de chargement au centre */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto" />
          <p className="text-white text-xs font-medium">
            {mediaSpace.media.generationStatus === 'generating-video' 
              ? t('generating-video') 
              : t('generating')}
          </p>
        </div>
      </div>

      {/* Nom du média - affiché uniquement au hover */}
      {mediaSpace.media.name && (
        <motion.div
          className="absolute bottom-0 left-0 bg-opacity-50 p-2 text-sm text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          variants={itemAnimation}
        >
          {mediaSpace.media.name}
        </motion.div>
      )}
    </motion.div>
  )
}

export default GeneratingMediaItem 