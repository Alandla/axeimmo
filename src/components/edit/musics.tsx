'use client'

import { useTranslations } from 'next-intl'
import Music from './music'
import { useState } from 'react'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { music } from '@/src/config/musics.config'
import { Genre } from '@/src/types/music'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/components/ui/pagination"
import { cn } from '@/src/lib/utils'
import { Button } from '../ui/button'
import { Settings, Settings2 } from 'lucide-react'

interface MusicsProps {
  video: any
  updateAudioSettings: (settings: any) => void
  isMobile?: boolean
  setActiveTabMobile?: (tab: string) => void
}

export default function Musics({ video, updateAudioSettings, isMobile = false, setActiveTabMobile }: MusicsProps) {
  const t = useTranslations('edit.audio')
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'ALL'>(video?.video?.audio?.music?.genre || 'ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const tracksPerPage = 8
  const [playingTrack, setPlayingTrack] = useState<{ track: any, audio: HTMLAudioElement | null }>({ track: null, audio: null })


  const handleChangeMobileTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile && setActiveTabMobile) {
      setActiveTabMobile('settings-audio');
    }
  };

  // Filtrer les pistes
  const filteredTracks = music.filter(track => {
    const matchesSearch = track.name.toLowerCase().includes(search.toLowerCase())
    const matchesGenre = selectedGenre === 'ALL' || track.genre === selectedGenre
    return matchesSearch && matchesGenre
  })

  // Calculer les pistes pour la page courante
  const indexOfLastTrack = currentPage * tracksPerPage
  const indexOfFirstTrack = indexOfLastTrack - tracksPerPage
  const currentTracks = filteredTracks.slice(indexOfFirstTrack, indexOfLastTrack)
  const totalPages = Math.ceil(filteredTracks.length / tracksPerPage)

  const handleTrackSelect = (trackId: string) => {
    const selectedTrack = music.find(track => track.name === trackId)
    
    // Si la piste est déjà sélectionnée, on la désélectionne
    if (video?.video?.audio?.music?.name === selectedTrack?.name) {
      updateAudioSettings({
        ...video?.video?.audio,
        music: null
      })
    } else {
      // Sinon, on sélectionne la nouvelle piste
      updateAudioSettings({ 
        ...video?.video?.audio,
        music: {
          name: selectedTrack?.name || '',
          url: selectedTrack?.url || '',
          genre: selectedTrack?.genre || '',
          volume: video?.video?.audio?.music?.volume || 0.12
        }
      })
    }
  }

  // Gérer les filtres
  const handleFilters = (filteredResults: typeof music) => {
    if (currentPage !== 1 && currentPage * tracksPerPage > filteredResults.length) {
      setCurrentPage(1)
    }
  }

  // Mise à jour de la recherche
  const handleSearch = (query: string) => {
    setSearch(query)
    const newFilteredTracks = music.filter(track => {
      const matchesSearch = track.name.toLowerCase().includes(query.toLowerCase())
      const matchesGenre = selectedGenre === 'ALL' || track.genre === selectedGenre
      return matchesSearch && matchesGenre
    })
    handleFilters(newFilteredTracks)
  }

  // Fonction pour générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pageNumbers = []
    const totalPagesToShow = isMobile ? 3 : 5
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handlePreviewTrack = (track: any) => {
    if (playingTrack.track?.name === track.name && playingTrack.audio) {
      playingTrack.audio.pause()
      setPlayingTrack({ track: null, audio: null })
    } else {
      if (playingTrack.audio) {
        playingTrack.audio.pause()
      }
      const audio = new Audio(track.url)
      setPlayingTrack({ track, audio })
      audio.play()
      audio.onended = () => setPlayingTrack({ track: null, audio: null })
    }
  }

  return (
    <>
      <div className="flex gap-4 mb-4">
        <Input
          placeholder={t('search')}
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1"
        />
        <Select 
          value={selectedGenre} 
          onValueChange={(value) => {
            setSelectedGenre(value as Genre | 'ALL')
            handleFilters(filteredTracks)
          }}
        >
          <SelectTrigger className={`${isMobile ? 'w-[150px]' : 'w-[180px]'}`}>
            <SelectValue placeholder={t('select_genre')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t('all_genres')}</SelectItem>
            {Object.values(Genre).map((genre) => (
              <SelectItem key={genre} value={genre}>
                {t(`genres.${genre.toLowerCase()}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isMobile && (
          <Button size="icon" variant="outline" onClick={handleChangeMobileTab}>
            <Settings size={16} />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-2 gap-4 mb-4">
        {currentTracks.map((track) => (
          <Music
            key={track.name}
            track={{
              id: track.name,
              name: track.name,
              url: track.url,
              genre: track.genre,
              style: track.style
            }}
            isSelected={video?.video?.audio?.music?.name === track.name}
            onSelect={handleTrackSelect}
            playingTrack={playingTrack}
            onPreviewTrack={handlePreviewTrack}
            isMobile={isMobile}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                showText={!isMobile}
                onClick={() => handlePageChange(currentPage - 1)}
                className={cn(
                  "cursor-pointer",
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
                showText={!isMobile}
                onClick={() => handlePageChange(currentPage + 1)}
                className={cn(
                  "cursor-pointer",
                  currentPage === totalPages && "pointer-events-none opacity-50"
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  )
}