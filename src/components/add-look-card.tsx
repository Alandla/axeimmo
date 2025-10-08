'use client'

import { Plus } from 'lucide-react'
import { Card } from '@/src/components/ui/card'

interface AddLookCardProps {
  onFileUpload: () => void
  isUploading?: boolean
  disabled?: boolean
}

export function AddLookCard({ onFileUpload, isUploading = false, disabled = false }: AddLookCardProps) {
  return (
    <Card 
      className={`relative overflow-hidden rounded-lg transition-all duration-150 ${
        disabled || isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:ring-2 hover:ring-primary/20'
      }`}
      onClick={disabled || isUploading ? undefined : onFileUpload}
      aria-disabled={disabled || isUploading}
    >
      {/* Contenu principal centré */}
      <div className="w-full aspect-[3/4] relative bg-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Plus className="h-12 w-12 text-gray-400" />
          <p className="text-sm text-gray-600 text-center font-medium">Add picture</p>
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
