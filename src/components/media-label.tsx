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
import { useTranslations } from 'next-intl'

export function MediaLabel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const { files, setFiles } = useCreationStore()
  const t = useTranslations('media')
  
  const mediaFiles = useMemo(() => 
    files.filter(file => file.type === "media"),
    [files]
  )

  const [mediaUrls, setMediaUrls] = useState<string[]>([])

  const textareaRefs = useMemo(() => 
    Array(mediaFiles.length).fill(null).map(() => React.createRef<HTMLTextAreaElement>()),
    [mediaFiles.length]
  )

  const fileIds = useMemo(() => 
    mediaFiles.map(file => file.file.name + file.file.size), 
    [mediaFiles.map(f => f.file.name + f.file.size).join(',')]
  )

  useEffect(() => {
    const urls = mediaFiles.map(file => URL.createObjectURL(file.file))
    setMediaUrls(urls)

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url))
    }
  }, [fileIds])

  const handleNext = () => {
    if (currentIndex + 2 < mediaFiles.length) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleLabelChange = (index: number, label: string) => {
    const updatedFiles = files.map(file => {
      const mediaFileAtIndex = mediaFiles[index];
      if (file === mediaFileAtIndex) {
        return { ...file, label };
      }
      return file;
    });
    setFiles(updatedFiles);
  }

  const handleTabPress = () => {
    if (currentIndex + 1 < mediaFiles.length) {
      handleNext()
      textareaRefs[currentIndex + 1]?.current?.focus()
    }
  }

  if (mediaFiles.length === 0) {
    return (
      <div className="text-center p-4">
        {t('no_media_uploaded')}
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle className="text-base font-semibold">
          {t('alert.title')}
        </AlertTitle>
        <AlertDescription>
          {t('alert.description')}
        </AlertDescription>
      </Alert>

      <div className="overflow-x-hidden">
        <div 
          className="flex gap-4 transition-transform duration-300"
          style={{ transform: `translateX(-${currentIndex * 53}%)` }}
        >
          {mediaFiles.map((file, idx) => (
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
              isActive={currentIndex + 2 < mediaFiles.length}
              className={`${currentIndex + 2 < mediaFiles.length ? 'cursor-pointer' : 'opacity-50'}`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
