'use client'

import { useEffect, useState } from 'react'
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Button } from "@/src/components/ui/button"
import { IconGenderFemale, IconGenderMale, IconGenderMaleFemale, VoiceCard } from './voice-card'
import { Badge } from "@/src/components/ui/badge"
import { Check } from "lucide-react"
import { useTranslations } from 'next-intl'
import { avatarsConfig } from '../config/avatars.config'
import { Avatar, AvatarLook } from '../types/avatar'
import { AvatarCard } from './avatar-card'
import { AvatarLookCard } from './avatar-look-card'
import { useCreationStore } from '../store/creationStore'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/components/ui/pagination"
import { cn, getMostFrequentString } from '@/src/lib/utils'
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import { getSpaceAvatars } from '../service/space.service'

export function AvatarGridComponent() {
  const t = useTranslations('avatars')
  const tCommon = useTranslations('common')

  const { selectedVoice, setSelectedLook } = useCreationStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGender, setSelectedGender] = useState<string>(selectedVoice?.gender || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const avatarsPerPage = 6
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [activeAvatar, setActiveAvatar] = useState<Avatar | null>(null)
  const [avatars, setAvatars] = useState<Avatar[]>(avatarsConfig)

  const { activeSpace, lastUsedParameters } = useActiveSpaceStore()

  // Ajouter l'état pour la pagination des looks
  const [currentLookPage, setCurrentLookPage] = useState(1)
  const looksPerPage = 6

  // Obtenir tous les tags uniques
  const allTags = Array.from(new Set(avatars.flatMap(avatar => avatar.tags)))

  useEffect(() => {
    const fetchSpaceAvatars = async (lastUsed? : String | undefined) => {
        if (activeSpace?.id) {
            const spaceAvatars : Avatar[] = await getSpaceAvatars(activeSpace.id)
            if (spaceAvatars.length > 0) {
              setAvatars([...spaceAvatars, ...avatars]);
              if (lastUsed) {
                const avatar = spaceAvatars.find((avatar) => avatar.id === lastUsed);
                if (avatar) {
                  const look = avatar.looks.find(l => l.id === lastUsed);
                  if (look) {
                    setSelectedLook(look);
                  }
                }
              }
            }
        }
    }

    let lastUsed : String | undefined
    if (lastUsedParameters) {
      const mostFrequent = getMostFrequentString(lastUsedParameters.avatars)
      if (mostFrequent && mostFrequent === "999") {
        lastUsed = mostFrequent
        const avatar = avatarsConfig.find((avatar) => avatar.looks.some(look => look.id === lastUsed));
        if (avatar) {
          const look = avatar.looks.find(l => l.id === lastUsed);
          if (look) {
            setSelectedLook(look);
          }
        }
      }
    }

    if (activeSpace) {
        fetchSpaceAvatars(lastUsed)
    }
}, [activeSpace])

  // Filtrer les avatars
  const filteredAvatars = avatars.filter(avatar => {
    const matchesSearch = avatar.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGender = selectedGender === 'all' ? true : avatar.gender === selectedGender
    const matchesTags = selectedTags.length === 0 ? true : selectedTags.every(tag => avatar.tags.includes(tag))
    return matchesSearch && matchesGender && matchesTags
  })

  // Calculer les avatars pour la page courante
  const indexOfLastAvatar = currentPage * avatarsPerPage
  const indexOfFirstAvatar = indexOfLastAvatar - avatarsPerPage
  const currentAvatars = filteredAvatars.slice(indexOfFirstAvatar, indexOfLastAvatar)
  const totalPages = Math.ceil(filteredAvatars.length / avatarsPerPage)

  // Calculs pour la pagination des looks
  const filteredLooks = activeAvatar ? activeAvatar.looks.filter(look => {
    if (selectedTags.length === 0) return true
    return selectedTags.every(tag => look.tags?.includes(tag) || false)
  }) : []

  const indexOfLastLook = currentLookPage * looksPerPage
  const indexOfFirstLook = indexOfLastLook - looksPerPage
  const currentLooks = filteredLooks.slice(indexOfFirstLook, indexOfLastLook)
  const totalLookPages = Math.ceil(filteredLooks.length / looksPerPage)

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(newTags)
    handleFilters(filteredAvatars)
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Empêche le scroll vertical de la page
    e.preventDefault();
    
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  }

  // Mettre à jour les gestionnaires d'événements des filtres
  const handleFilters = (filteredResults: Avatar[]) => {
    if (currentPage !== 1 && currentPage * avatarsPerPage > filteredResults.length) {
      setCurrentPage(1)
    }
  }

  // Mise à jour de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const newFilteredAvatars = avatars.filter(avatar => {
      const matchesSearch = avatar.name.toLowerCase().includes(query.toLowerCase())
      const matchesGender = selectedGender === 'all' ? true : avatar.gender === selectedGender
      const matchesTags = selectedTags.length === 0 ? true : selectedTags.every(tag => avatar.tags.includes(tag))
      return matchesSearch && matchesGender && matchesTags
    })
    handleFilters(newFilteredAvatars)
  }

  // Fonctions de pagination pour les looks
  const getLookPageNumbers = () => {
    const pageNumbers = []
    const totalPagesToShow = 5
    const halfWay = Math.floor(totalPagesToShow / 2)
    
    let startPage = Math.max(currentLookPage - halfWay, 1)
    let endPage = Math.min(startPage + totalPagesToShow - 1, totalLookPages)
    
    if (endPage - startPage + 1 < totalPagesToShow) {
      startPage = Math.max(endPage - totalPagesToShow + 1, 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    return {
      numbers: pageNumbers,
      showStartEllipsis: startPage > 1,
      showEndEllipsis: endPage < totalLookPages
    }
  }

  const getPageNumbers = () => {
    const pageNumbers = []
    const totalPagesToShow = 5
    const halfWay = Math.floor(totalPagesToShow / 2)
    
    let startPage = Math.max(currentPage - halfWay, 1)
    let endPage = Math.min(startPage + totalPagesToShow - 1, totalPages)
    
    if (endPage - startPage + 1 < totalPagesToShow) {
      startPage = Math.max(endPage - totalPagesToShow + 1, 1)
    }
  
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
  
    return {
      numbers: pageNumbers,
      showStartEllipsis: startPage > 1,
      showEndEllipsis: endPage < totalPages
    }
  }

  const handleLookPageChange = (page: number) => {
    if (page >= 1 && page <= totalLookPages) {
      setCurrentLookPage(page)
    }
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <AnimatePresence mode="wait">
        {activeAvatar ? (
          <motion.div
            key="avatar-header"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Button size="icon" variant="ghost" onClick={() => {
              setActiveAvatar(null)
              setCurrentLookPage(1)
            }}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-xl font-semibold">{activeAvatar.name}</h2>
            <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
              {activeAvatar.looks.length} Looks
            </Badge>
          </motion.div>
        ) : (
          <motion.div
            key="search-header"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
          >
            <div className="flex gap-4 items-center">
              <Input
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="max-w-xl"
              />
              <Select value={selectedGender} onValueChange={(value) => {
                setSelectedGender(value)
                handleFilters(filteredAvatars)
              }}>
                <SelectTrigger className="w-[100px] sm:w-[180px]">
                  <SelectValue>
                    {selectedGender === 'all' ? (
                      <div className="flex items-center">
                        <IconGenderMaleFemale className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">{tCommon('all-m')}</span>
                      </div>
                    ) : selectedGender === 'male' ? (
                      <div className="flex items-center">
                        <IconGenderMale className="w-4 h-4 text-blue-500" />
                        <span className="hidden sm:inline ml-1">{t('gender.male')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <IconGenderFemale className="w-4 h-4 text-pink-500" />
                        <span className="hidden sm:inline ml-1">{t('gender.female')}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex">
                      <IconGenderMaleFemale className="w-4 h-4 mr-2" />
                      {tCommon('all-m')}
                    </div>
                  </SelectItem>
                  <SelectItem value="male">
                    <div className="flex">
                      <IconGenderMale className="w-4 h-4 mr-2 text-blue-500" />
                      {t('gender.male')}
                    </div>
                  </SelectItem>
                  <SelectItem value="female">
                    <div className="flex">
                      <IconGenderFemale className="w-4 h-4 mr-2 text-pink-500" />
                      {t('gender.female')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div 
        className="overflow-x-auto scrollbar-hide mt-2"
        onWheel={handleWheel}
      >
        <div className="flex gap-2">
        {activeAvatar ? (
          activeAvatar.tags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => toggleTag(tag)}
            >
              {selectedTags.includes(tag) && (
                <Check className="w-3 h-3 mr-1" />
              )}
              {t(`tags.${tag}`)}
            </Badge>
          ))
        ) : (
          allTags.map(tag => (
            <Badge
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => toggleTag(tag)}
            >
              {selectedTags.includes(tag) && (
                <Check className="w-3 h-3 mr-1" />
              )}
              {t(`tags.${tag}`)}
            </Badge>
          ))
        )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
        {activeAvatar ? (
          // Afficher les looks de l'avatar sélectionné
          (currentLooks as AvatarLook[]).length > 0 ? (
            (currentLooks as AvatarLook[]).map((look: AvatarLook) => (
              <AvatarLookCard
                key={look.id}
                look={look}
                avatarName={activeAvatar.name}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              {t('no-looks-found')}
            </div>
          )
        ) : (
          // Afficher la liste des avatars
          (currentAvatars as Avatar[]).map((avatar: Avatar) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              onClick={() => setActiveAvatar(avatar)}
            />
          ))
        )}
      </div>

      {activeAvatar ? (
        // Pagination des looks
        totalLookPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  showText={false}
                  onClick={() => handleLookPageChange(currentLookPage - 1)}
                  className={cn(
                    "cursor-pointer sm:hidden",
                    currentLookPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
                <PaginationPrevious 
                  showText={true}
                  onClick={() => handleLookPageChange(currentLookPage - 1)}
                  className={cn(
                    "cursor-pointer hidden sm:flex",
                    currentLookPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>

              {getLookPageNumbers().showStartEllipsis && (
                <>
                  <PaginationItem>
                    <PaginationLink onClick={() => handleLookPageChange(1)}>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                </>
              )}

              {getLookPageNumbers().numbers.map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={currentLookPage === pageNumber}
                    onClick={() => handleLookPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {getLookPageNumbers().showEndEllipsis && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink onClick={() => handleLookPageChange(totalLookPages)}>
                      {totalLookPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext 
                showText={false}
                onClick={() => handleLookPageChange(currentLookPage + 1)}
                className={cn(
                  "cursor-pointer sm:hidden",
                  currentLookPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
              <PaginationNext 
                showText={true}
                onClick={() => handleLookPageChange(currentLookPage + 1)}
                className={cn(
                  "cursor-pointer hidden sm:flex",
                  currentLookPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )
      ) : (
        // Pagination des avatars
        totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  showText={false}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={cn(
                    "cursor-pointer sm:hidden",
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
                <PaginationPrevious 
                  showText={true}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={cn(
                    "cursor-pointer hidden sm:flex",
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>

              {getPageNumbers().showStartEllipsis && (
                <>
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(1)}>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                </>
              )}

              {getPageNumbers().numbers.map((pageNumber) => (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    isActive={currentPage === pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              ))}

              {getPageNumbers().showEndEllipsis && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink onClick={() => handlePageChange(totalPages)}>
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext 
                  showText={false}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={cn(
                    "cursor-pointer sm:hidden",
                    currentPage === totalPages && "pointer-events-none opacity-50"
                  )}
                />
                <PaginationNext 
                  showText={true}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={cn(
                    "cursor-pointer hidden sm:flex",
                    currentPage === totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )
      )}
    </div>
  )
}
