'use client'

import { useState } from 'react'
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Button } from "@/src/components/ui/button"
import { IconGenderFemale, IconGenderMale, IconGenderMaleFemale, VoiceCard } from './voice-card'
import { Badge } from "@/src/components/ui/badge"
import { Check } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Voice } from '../types/voice'
import { accentFlags, voices } from '../config/voices.config'

export function VoicesGridComponent() {
  const t = useTranslations('voices')
  const tCommon = useTranslations('common')

  const [playingId, setPlayingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccent, setSelectedAccent] = useState<string>('all')
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [playingVoice, setPlayingVoice] = useState<{ voice: Voice | null, audio: HTMLAudioElement | null }>({ voice: null, audio: null })
  const voicesPerPage = 6
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Obtenir tous les tags uniques
  const allTags = Array.from(new Set(voices.flatMap(voice => voice.tags)))

  // Filtrer les voix
  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAccent = selectedAccent === 'all' ? true : voice.accent === selectedAccent
    const matchesGender = selectedGender === 'all' ? true : voice.gender === selectedGender
    const matchesTags = selectedTags.length === 0 ? true : selectedTags.every(tag => voice.tags.includes(tag))
    return matchesSearch && matchesAccent && matchesGender && matchesTags
  })

  // Calculer les voix pour la page courante
  const indexOfLastVoice = currentPage * voicesPerPage
  const indexOfFirstVoice = indexOfLastVoice - voicesPerPage
  const currentVoices = filteredVoices.slice(indexOfFirstVoice, indexOfLastVoice)
  const totalPages = Math.ceil(filteredVoices.length / voicesPerPage)

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

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Empêche le scroll vertical de la page
    e.preventDefault();
    
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
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
    const newFilteredVoices = voices.filter(voice => {
      const matchesSearch = voice.name.toLowerCase().includes(query.toLowerCase())
      const matchesAccent = selectedAccent === 'all' ? true : voice.accent === selectedAccent
      const matchesGender = selectedGender === 'all' ? true : voice.gender === selectedGender
      const matchesTags = selectedTags.length === 0 ? true : selectedTags.every(tag => voice.tags.includes(tag))
      return matchesSearch && matchesAccent && matchesGender && matchesTags
    })
    handleFilters(newFilteredVoices)
  }

  return (
    <div className="space-y-4 mt-4">
      <div>
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Accent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <span className="mr-1">🌍</span> {tCommon('all-f')}
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Genre" />
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

      <div 
        className="overflow-x-auto scrollbar-hide mt-2"
        onWheel={handleWheel}
      >
        <div className="flex gap-2">
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
        </div>
      </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-4">
        {currentVoices.map((voice) => (
          <VoiceCard
            key={voice.id}
            voice={voice}
            playingVoice={playingVoice}
            onPreviewVoice={togglePlay}
          />
        ))}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: totalPages }, (_, i) => (
          <Button
            key={i + 1}
            variant={currentPage === i + 1 ? "default" : "outline"}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </Button>
        ))}
      </div>
    </div>
  )
}
