'use client'

import React, { useState } from 'react'
import { useCreationStore } from "../store/creationStore"
import { GenerationModeSelector } from "./ui/generation-mode-selector"
import { KlingGenerationMode } from "@/src/lib/fal"
import { useActiveSpaceStore } from "../store/activeSpaceStore"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/src/components/ui/pagination"

export function ExtractedImagesDisplay() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { extractedImagesMedia, animationMode, setAnimationMode } = useCreationStore()
  const { activeSpace } = useActiveSpaceStore()

  const handleNext = () => {
    if (currentIndex + 2 < extractedImagesMedia.length) {
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

  if (extractedImagesMedia.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Generation Mode Selector */}
      <GenerationModeSelector
        value={animationMode}
        onValueChange={handleModeChange}
        activeSpace={activeSpace}
      />

      <div className="overflow-x-hidden">
        <div 
          className="flex gap-4 transition-transform duration-300"
          style={{ transform: `translateX(-${currentIndex * 53}%)` }}
        >
          {extractedImagesMedia.map((media, idx) => (
            <div key={idx} className="w-1/2 flex-shrink-0">
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Image {idx + 1}</h3>
                </div>
                <div className="w-full aspect-square rounded-md overflow-hidden mb-4">
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
      
      {extractedImagesMedia.length > 2 && (
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
                isActive={currentIndex + 2 < extractedImagesMedia.length}
                className={`${currentIndex + 2 < extractedImagesMedia.length ? 'cursor-pointer' : 'opacity-50'}`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
} 