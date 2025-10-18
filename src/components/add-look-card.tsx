'use client'

import { Plus, Upload } from 'lucide-react'
import { Card } from '@/src/components/ui/card'
import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'

interface AddLookCardProps {
  onFileUpload: () => void
  onFileDrop?: (file: File) => void
  isUploading?: boolean
  disabled?: boolean
}

export function AddLookCard({ onFileUpload, onFileDrop, isUploading = false, disabled = false }: AddLookCardProps) {
  const t = useTranslations('avatars')
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    if (disabled || isUploading) return

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile && onFileDrop) {
      onFileDrop(imageFile)
    }
  }

  const handleClick = () => {
    if (disabled || isUploading) return
    onFileUpload()
  }

  return (
    <Card 
      className={`group relative overflow-hidden rounded-lg transition-all duration-150 border hover:cursor-pointer outline-2 outline-dashed outline-transparent ${
        isDragOver ? 'border-transparent outline-muted-foreground' : ''
      } ${
        disabled || isUploading ? 'cursor-not-allowed opacity-70' : ''
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-disabled={disabled || isUploading}
    >
      {/* Contenu principal centré */}
      <div className="w-full aspect-[3/4] relative bg-white group-hover:bg-accent transition-colors duration-150 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <AnimatePresence mode="wait">
            {isDragOver ? (
              <motion.div
                key="upload-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
              </motion.div>
            ) : (
              <motion.div
                key="plus-icon"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="h-12 w-12 text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            {isDragOver ? (
              <motion.p
                key="drop-text"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 5, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-center font-medium text-muted-foreground"
              >
                {t('drop-image-here')}
              </motion.p>
            ) : (
              <motion.p
                key="add-text"
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 5, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-center font-medium text-muted-foreground"
              >
                {t('add-picture')}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        {isUploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin" />
          </div>
        )}
      </div>
    </Card>
  )
}
