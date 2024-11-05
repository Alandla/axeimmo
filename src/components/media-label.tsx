'use client'

import React from 'react'
import { useCreationStore } from "../store/creationStore"
import { MediaLabelCard } from "./media-label-card"
import { useState, useEffect, useMemo } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/src/components/ui/pagination"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/src/components/ui/alert"
import { InfoIcon } from "lucide-react"

export function MediaLabel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { files, setFiles } = useCreationStore()
  
  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  // Créer un ref pour chaque textarea
  const textareaRefs = useMemo(() => 
    Array(files.length).fill(null).map(() => React.createRef<HTMLTextAreaElement>()),
    [files.length]
  )

  // Créer un tableau d'identifiants uniques pour les fichiers
  const fileIds = useMemo(() => 
    files.map(file => file.file.name + file.file.size), 
    [files.map(f => f.file.name + f.file.size).join(',')]
  )

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file.file))
    setMediaUrls(urls)

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [fileIds])

  const handleNext = () => {
    if (currentIndex + 2 < files.length) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleLabelChange = (index: number, label: string) => {
    const updatedFiles = files.map((file, idx) => {
      if (idx === index) {
        return { ...file, label }
      }
      return file
    })
    setFiles(updatedFiles)
  }

  const handleTabPress = () => {
    if (currentIndex + 1 < files.length) {
      handleNext()
      textareaRefs[currentIndex + 1]?.current?.focus()
    }
  }

  if (files.length === 0) {
    return (
      <div className="text-center p-4">
        Aucun fichier média n'a été téléchargé
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle className="text-base font-semibold">
          Conseil
        </AlertTitle>
        <AlertDescription>
          Pour un meilleur positionnement, utilisez des mots-clés qui apparaissent dans votre script.
        </AlertDescription>
      </Alert>

      <div className="overflow-x-hidden">
        <div 
          className="flex gap-4 transition-transform duration-300"
          style={{ transform: `translateX(-${currentIndex * 53}%)` }}
        >
          {files.map((file, idx) => (
            <div key={idx} className="w-1/2 flex-shrink-0">
              <MediaLabelCard
                mediaUrl={mediaUrls[idx]}
                index={idx}
                mediaType={file.file.type.startsWith('image/') ? 'image' : 'video'}
                label={file.label}
                onLabelChange={(label) => handleLabelChange(idx, label)}
                onTabPress={handleTabPress}
                textareaRef={textareaRefs[idx]}
              />
            </div>
          ))}
        </div>
      </div>
      
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
              isActive={currentIndex + 2 < files.length}
              className={`${currentIndex + 2 < files.length ? 'cursor-pointer' : 'opacity-50'}`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
