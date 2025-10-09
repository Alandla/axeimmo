'use client'

import { Plus } from 'lucide-react'
import { Card } from '@/src/components/ui/card'
import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'

interface AddLookCardProps {
  onFileUpload: () => void
  onFileDrop?: (file: File) => void
  isUploading?: boolean
  disabled?: boolean
}

export function AddLookCard({ onFileUpload, onFileDrop, isUploading = false, disabled = false }: AddLookCardProps) {
  const t = useTranslations('avatars')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      className={`relative overflow-hidden rounded-lg transition-all duration-150 ${
        disabled || isUploading 
          ? 'cursor-not-allowed opacity-70' 
          : isDragOver 
            ? 'cursor-pointer ring-2 ring-primary bg-primary/5' 
            : 'cursor-pointer hover:ring-2 hover:ring-primary/20'
      }`}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      aria-disabled={disabled || isUploading}
    >
      {/* Contenu principal centré */}
      <div className="w-full aspect-[3/4] relative bg-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Plus className={`h-12 w-12 transition-colors ${isDragOver ? 'text-primary' : 'text-gray-400'}`} />
          <p className={`text-sm text-center font-medium transition-colors ${
            isDragOver ? 'text-primary' : 'text-gray-600'
          }`}>
            {isDragOver ? t('drop-image-here') : t('add-picture')}
          </p>
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
