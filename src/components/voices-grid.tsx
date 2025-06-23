'use client'

import { useEffect, useState } from 'react'
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Button } from "@/src/components/ui/button"
import { IconGenderFemale, IconGenderMale, IconGenderMaleFemale, VoiceCard } from './voice-card'
import { Badge } from "@/src/components/ui/badge"
import { Check } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Voice } from '../types/voice'
import { accentFlags, voicesConfig } from '../config/voices.config'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from "@/src/components/ui/pagination"
import { cn, getMostFrequentString } from "@/src/lib/utils"
import { useActiveSpaceStore } from '../store/activeSpaceStore'
import { getSpaceVoices } from '../service/space.service'
import { useCreationStore } from '../store/creationStore'
import { HorizontalScrollList } from './ui/horizontal-scroll-list'

export function VoicesGridComponent() {
  const t = useTranslations('voices')
  const tCommon = useTranslations('common')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccent, setSelectedAccent] = useState<string>('all')
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [playingVoice, setPlayingVoice] = useState<{ voice: Voice | null, audio: HTMLAudioElement | null }>({ voice: null, audio: null })
  const voicesPerPage = 6
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [voices, setVoices] = useState<Voice[]>(voicesConfig)

  const { activeSpace, lastUsedParameters } = useActiveSpaceStore()
  const { setSelectedVoice } = useCreationStore()

  // Obtenir tous les tags uniques
  const allTags = Array.from(new Set(voices.flatMap(voice => voice.tags)))

  // Fonction pour trier les voix avec les dernières utilisées en premier
  const sortVoicesByLastUsed = (voicesToSort: Voice[]) => {
    if (!lastUsedParameters?.voices) return voicesToSort;
    
    return [...voicesToSort].sort((a, b) => {
      const aIsLastUsed = lastUsedParameters.voices.includes(a.id);
      const bIsLastUsed = lastUsedParameters.voices.includes(b.id);
      
      if (aIsLastUsed && !bIsLastUsed) return -1;
      if (!aIsLastUsed && bIsLastUsed) return 1;
      
      // Si les deux sont dans lastUsed, trier par ordre d'utilisation (plus récent d'abord)
      if (aIsLastUsed && bIsLastUsed) {
        const aIndex = lastUsedParameters.voices.indexOf(a.id);
        const bIndex = lastUsedParameters.voices.indexOf(b.id);
        return aIndex - bIndex;
      }
      
      return 0;
    });
  };

  // Filtrer les voix
  const filteredVoices = sortVoicesByLastUsed(voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAccent = selectedAccent === 'all' ? true : voice.accent === selectedAccent
    const matchesGender = selectedGender === 'all' ? true : voice.gender === selectedGender
    const matchesTags = selectedTags.length === 0 ? true : selectedTags.every(tag => voice.tags.includes(tag))
    return matchesSearch && matchesAccent && matchesGender && matchesTags
  }))

  // Calculer les voix pour la page courante
  const indexOfLastVoice = currentPage * voicesPerPage
  const indexOfFirstVoice = indexOfLastVoice - voicesPerPage
  const currentVoices = filteredVoices.slice(indexOfFirstVoice, indexOfLastVoice)
  const totalPages = Math.ceil(filteredVoices.length / voicesPerPage)

  useEffect(() => {
    const fetchSpaceVoices = async (lastUsed? : String | undefined) => {
        if (activeSpace?.id) {
            const spaceVoices : Voice[] = await getSpaceVoices(activeSpace.id)
            if (spaceVoices && spaceVoices.length > 0) {
              setVoices([...spaceVoices, ...voices]);
              if (lastUsed) {
                const voice = voicesConfig.find((voice) => voice.id === lastUsed);
                if (voice) {
                  setSelectedVoice(voice);
                }
              }
            }
        }
    }

    let lastUsed : String | undefined
    if (lastUsedParameters) {
      const mostFrequent = getMostFrequentString(lastUsedParameters.voices)
      if (mostFrequent) {
        lastUsed = mostFrequent
        const voice = voicesConfig.find((voice) => voice.id === mostFrequent);
        if (voice) {
          setSelectedVoice(voice);
        }
      }
    }

    if (activeSpace) {
        fetchSpaceVoices()
    }
}, [activeSpace?.id])

  const togglePlay = (voice: Voice) => {
    if (voice.previewUrl) {
      if (playingVoice.voice?.id === voice.id && playingVoice.audio) {
        playingVoice.audio?.pause()
        setPlayingVoice({voice: null, audio: null})
      } else {
        if (playingVoice.audio) {
          playingVoice.audio.pause()
        }
        const audio = new Audio(voice.previewUrl)
        setPlayingVoice({voice, audio})
        audio.play()
        audio.onended = () => setPlayingVoice({voice: null, audio: null})
      }
    }
  }

  const removeSelectedAccent = (value: string) => {
    console.log('removeSelectedAccent', value)
    if (selectedAccent === value) {
      setSelectedAccent('')
    }
  }

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(newTags)
    handleFilters(filteredVoices)
  }

  // Mettre à jour les gestionnaires d'événements des filtres
  const handleFilters = (filteredResults: Voice[]) => {
    if (currentPage !== 1 && currentPage * voicesPerPage > filteredResults.length) {
      setCurrentPage(1)
    }
  }

  // Mise à jour de la recherche
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    const newFilteredVoices = sortVoicesByLastUsed(voices.filter(voice => {
      const matchesSearch = voice.name.toLowerCase().includes(query.toLowerCase())
      const matchesAccent = selectedAccent === 'all' ? true : voice.accent === selectedAccent
      const matchesGender = selectedGender === 'all' ? true : voice.gender === selectedGender
      const matchesTags = selectedTags.length === 0 ? true : selectedTags.every(tag => voice.tags.includes(tag))
      return matchesSearch && matchesAccent && matchesGender && matchesTags
    }))
    handleFilters(newFilteredVoices)
  }

  const getPageNumbers = () => {
    const pageNumbers = []
    const totalPagesToShow = 3
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

  return (
    <div className="space-y-4 mt-4">
      <div className="flex gap-4 items-center">
        <Input
          placeholder={t('search')}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={selectedAccent} onValueChange={(value) => {
          setSelectedAccent(value)
          handleFilters(filteredVoices)
        }}>
          <SelectTrigger className="w-[100px] sm:w-[180px]">
            <SelectValue>
              {selectedAccent === 'all' ? (
                <div className="flex items-center">
                  <span className="mr-1">🌍</span>
                  <span className="hidden sm:inline ml-1">{tCommon('all-f')}</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span>{accentFlags[selectedAccent]}</span>
                  <span className="hidden sm:inline ml-1">{t(`accent.${selectedAccent}`)}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="mr-1">🌍</span> {t('accent.all')}
            </SelectItem>
            {Array.from(new Set(voices.map(v => v.accent))).map(accent => (
              <SelectItem key={accent} value={accent} onClick={() => removeSelectedAccent(accent)}>
                <span className="mr-1">{accentFlags[accent]}</span> {t(`accent.${accent}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedGender} onValueChange={(value) => {
          setSelectedGender(value)
          handleFilters(filteredVoices)
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
              <div className="flex items-center">
                <IconGenderMaleFemale className="w-4 h-4 mr-2" />
                {tCommon('all-m')}
              </div>
            </SelectItem>
            <SelectItem value="male">
              <div className="flex items-center">
                <IconGenderMale className="w-4 h-4 mr-2 text-blue-500" />
                {t('gender.male')}
              </div>
            </SelectItem>
            <SelectItem value="female">
              <div className="flex items-center">
                <IconGenderFemale className="w-4 h-4 mr-2 text-pink-500" />
                {t('gender.female')}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <HorizontalScrollList className="mt-2">
        {allTags.map(tag => (
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
        ))}
      </HorizontalScrollList>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
        {currentVoices.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            playingVoice={playingVoice}
            onPreviewVoice={togglePlay}
            isLastUsed={lastUsedParameters?.voices?.includes(voice.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                showText={false}
                onClick={() => setCurrentPage(currentPage - 1)}
                className={cn(
                  "cursor-pointer sm:hidden",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
              <PaginationPrevious 
                showText={true}
                onClick={() => setCurrentPage(currentPage - 1)}
                className={cn(
                  "cursor-pointer hidden sm:flex",
                  currentPage === 1 && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>

            {getPageNumbers().showStartEllipsis && (
              <>
                <PaginationItem>
                  <PaginationLink onClick={() => setCurrentPage(1)}>
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
                  onClick={() => setCurrentPage(pageNumber)}
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
                  <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            <PaginationItem>
              <PaginationNext 
                showText={false}
                onClick={() => setCurrentPage(currentPage + 1)}
                className={cn(
                  "cursor-pointer sm:hidden",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
              <PaginationNext 
                showText={true}
                onClick={() => setCurrentPage(currentPage + 1)}
                className={cn(
                  "cursor-pointer hidden sm:flex",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
