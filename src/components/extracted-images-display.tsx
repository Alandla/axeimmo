'use client'

import React, { useState } from 'react'
import { useCreationStore } from "../store/creationStore"
import { GenerationModeSelector } from "./ui/generation-mode-selector"
import { KlingGenerationMode } from "@/src/lib/fal"
import { useActiveSpaceStore } from "../store/activeSpaceStore"
import { Checkbox } from "@/src/components/ui/checkbox"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/src/components/ui/pagination"

const EXCLUDED_SOURCE = "EXCLUDED"

export function ExtractedImagesDisplay() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { extractedImagesMedia, animationMode, setAnimationMode, setExtractedImagesMedia, files } = useCreationStore()
  const { activeSpace } = useActiveSpaceStore()

  // Combiner les images uploadées et les images extraites
  const uploadedImages = files
    .filter(file => file.usage === 'media' && file.type === 'image' && 'file' in file)
    .map(file => {
      const fileToUpload = file as { file: File; type: string; usage: string }
      return {
        id: `uploaded-${fileToUpload.file.name}-${fileToUpload.file.lastModified}`,
        type: 'image' as const,
        usage: 'media' as const,
        name: fileToUpload.file.name,
        image: {
          link: URL.createObjectURL(fileToUpload.file),
          width: 1920,
          height: 1080
        },
        source: 'uploaded'
      }
    })

  const allImages = [...uploadedImages, ...extractedImagesMedia]

  const handleNext = () => {
    if (currentIndex + 2 < allImages.length) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleModeChange = (value: string) => {
    setAnimationMode(value as KlingGenerationMode)
  }

  const handleImageSelection = (index: number, isSelected: boolean) => {
    const selectedImage = allImages[index]
    
    if (selectedImage.source === 'uploaded') {
      // Pour les images uploadées, on ne peut pas les modifier directement
      // car elles sont dans files. On pourrait implémenter une logique différente ici
      // Pour l'instant, les images uploadées sont toujours sélectionnées par défaut
      return
    }
    
    // Pour les images extraites, on continue avec la logique existante
    const extractedIndex = index - uploadedImages.length
    if (extractedIndex >= 0) {
      const updatedMedia = [...extractedImagesMedia]
      updatedMedia[extractedIndex] = {
        ...updatedMedia[extractedIndex],
        source: isSelected ? undefined : EXCLUDED_SOURCE
      }
      setExtractedImagesMedia(updatedMedia)
    }
  }

  const isImageSelected = (media: any) => {
    // Les images uploadées sont toujours sélectionnées
    if (media.source === 'uploaded') {
      return true
    }
    // Les images extraites suivent la logique existante
    return media.source !== EXCLUDED_SOURCE
  }

  if (allImages.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Generation Mode Selector - Masqué pour l'instant
      <GenerationModeSelector
        value={animationMode}
        onValueChange={handleModeChange}
        activeSpace={activeSpace}
      /> */}

      <div className="overflow-x-hidden">
        <div 
          className="flex gap-4 transition-transform duration-300"
          style={{ transform: `translateX(-${currentIndex * 53}%)` }}
        >
          {allImages.map((media, idx) => (
            <div key={idx} className="w-1/2 flex-shrink-0">
              <div className="bg-white rounded-lg border p-4 relative">
                {/* Checkbox de sélection en haut à droite */}
                <div className="absolute top-2 right-2 z-10">
                  <div className="bg-white/80 backdrop-blur-sm rounded-md p-1">
                    <Checkbox
                      checked={isImageSelected(media)}
                      onCheckedChange={(checked) => handleImageSelection(idx, checked as boolean)}
                      className="w-5 h-5"
                      disabled={media.source === 'uploaded'}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">
                    {media.source === 'uploaded' ? 'Uploaded' : 'Extracted'} Image {idx + 1}
                  </h3>
                </div>
                <div className={`w-full aspect-square rounded-md overflow-hidden mb-4 ${!isImageSelected(media) ? 'opacity-50' : ''}`}>
                  <img 
                    src={media.image?.link} 
                    alt={media.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {allImages.length > 2 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePrevious}
                isActive={currentIndex > 0}
                className={`${currentIndex > 0 ? 'cursor-pointer' : 'opacity-50'}`}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                onClick={handleNext}
                isActive={currentIndex + 2 < allImages.length}
                className={`${currentIndex + 2 < allImages.length ? 'cursor-pointer' : 'opacity-50'}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
} 