'use client'

import { useState } from 'react'
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Button } from "@/src/components/ui/button"
import { IconGenderFemale, IconGenderMale, IconGenderMaleFemale, VoiceCard } from './voice-card'
import { Badge } from "@/src/components/ui/badge"
import { Check } from "lucide-react"
import { useTranslations } from 'next-intl'

export type Voice = {
  id: string
  name: string
  gender: 'male' | 'female'
  accent: string
  tags: string[]
  previewUrl: string
}

const voices: Voice[] = [
  { id: '1', name: 'Jean', gender: 'male', accent: 'french', tags: ['narrator', 'documentary', 'educational'], previewUrl: 'https://example.com/jean.mp3' },
  { id: '2', name: 'Marie', gender: 'female', accent: 'quebecois', tags: ['advertising', 'voice-over'], previewUrl: 'https://example.com/marie.mp3' },
  { id: '3', name: 'Carlos', gender: 'male', accent: 'spanish', tags: ['documentary', 'educational'], previewUrl: 'https://example.com/carlos.mp3' },
  { id: '4', name: 'Yuki', gender: 'female', accent: 'japanese', tags: ['animation', 'video-game'], previewUrl: 'https://example.com/yuki.mp3' },
  { id: '5', name: 'John', gender: 'male', accent: 'english', tags: ['narrator', 'documentary'], previewUrl: 'https://example.com/john.mp3' },
  { id: '6', name: 'Jane', gender: 'female', accent: 'english', tags: ['narrator', 'documentary'], previewUrl: 'https://example.com/jane.mp3' },
  { id: '7', name: 'John', gender: 'male', accent: 'english', tags: ['narrator', 'documentary'], previewUrl: 'https://example.com/john.mp3' },
  { id: '8', name: 'Jane', gender: 'female', accent: 'english', tags: ['narrator', 'documentary'], previewUrl: 'https://example.com/jane.mp3' },
  { id: '9', name: 'Jean', gender: 'male', accent: 'french', tags: ['narrator', 'documentary'], previewUrl: 'https://example.com/jean.mp3' },
  { id: '10', name: 'Marie', gender: 'female', accent: 'quebecois', tags: ['advertising', 'voice-over'], previewUrl: 'https://example.com/marie.mp3' },
  { id: '11', name: 'Carlos', gender: 'male', accent: 'spanish', tags: ['documentary', 'educational'], previewUrl: 'https://example.com/carlos.mp3' },
]

// Ajouter ce mapping après la déclaration des voices
export const accentFlags: Record<string, string> = {
  'french': '🇫🇷',
  'quebecois': '🇨🇦',
  'spanish': '🇪🇸',
  'japanese': '🇯🇵',
  'english': '🇬🇧',
}

export function VoicesGridComponent() {
  const t = useTranslations('voices')
  const tCommon = useTranslations('common')

  const [playingId, setPlayingId] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccent, setSelectedAccent] = useState<string>('all')
  const [selectedGender, setSelectedGender] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
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

  const togglePlay = (id: string, url: string) => {
    if (playingId === id) {
      setPlayingId(null)
      // Stop the audio
    } else {
      setPlayingId(id)
      // Play the audio
      const audio = new Audio(url)
      audio.play()
      audio.onended = () => setPlayingId(null)
    }
  }

  const removeSelectedAccent = (value: string) => {
    console.log('removeSelectedAccent', value)
    if (selectedAccent === value) {
      setSelectedAccent('')
    }
  }

  const toggleSelection = (voice: Voice) => {
    setSelectedVoice(voice)
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Empêche le scroll vertical de la page
    e.preventDefault();
    
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <div>
      <div className="flex gap-4 items-center">
        <Input
          placeholder={t('search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-xs"
        />
        <Select value={selectedAccent} onValueChange={setSelectedAccent}>
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
        <Select value={selectedGender} onValueChange={setSelectedGender}>
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
            playingId={playingId}
            selectedVoice={selectedVoice}
            onPreviewVoice={togglePlay}
            onSelectVoice={toggleSelection}
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
