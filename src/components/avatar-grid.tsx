'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from "@/src/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select"
import { Button } from "@/src/components/ui/button"
import { IconGenderFemale, IconGenderMale, IconGenderMaleFemale, VoiceCard } from './voice-card'
import { Badge } from "@/src/components/ui/badge"
import { Check, UserRoundX, Plus } from "lucide-react"
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
import { HorizontalScrollList } from './ui/horizontal-scroll-list'
import { Card, CardContent } from "@/src/components/ui/card"
import { InfiniteScroll } from '@/src/components/ui/infinite-scroll'
import CreateAvatarModal from '@/src/components/modal/create-avatar-modal'
import AvatarLookChatbox from '@/src/components/avatar-look-chatbox'
import { getMediaUrlFromFileByPresignedUrl } from '@/src/service/upload.service'
import { AddLookCard } from './add-look-card'

// Composant pour la carte "No avatar"
function NoAvatarCard({ 
  selectedLook, 
  onLookChange, 
  onAvatarNameChange 
}: { 
  selectedLook: AvatarLook | null, 
  onLookChange: (look: AvatarLook | null) => void,
  onAvatarNameChange: (name: string | null) => void 
}) {
  const t = useTranslations('avatars')
  const isSelected = !selectedLook

  const handleClick = () => {
    onLookChange(null)
    onAvatarNameChange(null)
  }

  return (
    <Card 
      className={`relative overflow-hidden rounded-lg cursor-pointer transition-all duration-150 ${isSelected ? 'ring-2 ring-primary' : ''}`}
      onClick={handleClick}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-primary text-primary-foreground rounded-full p-1">
            <Check className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Image principale */}
      <div className="w-full aspect-[3/4] relative bg-gray-100 flex items-center justify-center">
        <UserRoundX className="h-12 w-12 text-gray-400" />
      </div>

      {/* Bande d'information en bas */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">{t('no-avatar-name')}</h3>
        </div>
      </div>
    </Card>
  )
}

interface AvatarGridComponentProps {
  mode?: 'default' | 'large';
  variant?: 'select' | 'create';
  // Props pour le mode contrôlé
  selectedLook?: AvatarLook | null;
  onLookChange?: (look: AvatarLook | null) => void;
  selectedAvatarName?: string | null;
  onAvatarNameChange?: (name: string | null) => void;
  // Props pour personnaliser le comportement
  showNoAvatar?: boolean;
}

export function AvatarGridComponent({ 
  mode = 'default',
  variant = 'select',
  selectedLook: controlledSelectedLook,
  onLookChange,
  selectedAvatarName: controlledSelectedAvatarName,
  onAvatarNameChange,
  showNoAvatar = true
}: AvatarGridComponentProps) {
  const t = useTranslations('avatars')
  const tCommon = useTranslations('common')

  // Déterminer si on est en mode contrôlé
  const isControlled = controlledSelectedLook !== undefined || onLookChange !== undefined

  // Store hooks (utilisés seulement en mode non-contrôlé)
  const storeState = useCreationStore()
  const { selectedVoice, setSelectedLook: setStoreSelectedLook, selectedLook: storeSelectedLook } = storeState

  // Valeurs effectives (contrôlées ou du store)
  const selectedLook = isControlled ? controlledSelectedLook : storeSelectedLook
  const selectedAvatarName = isControlled ? controlledSelectedAvatarName : storeState.selectedAvatarName

  // Fonctions de mise à jour
  const setSelectedLook = (look: AvatarLook | null) => {
    if (isControlled && onLookChange) {
      onLookChange(look)
    } else if (!isControlled) {
      setStoreSelectedLook(look)
    }
  }

  const setSelectedAvatarName = (name: string | null) => {
    if (isControlled && onAvatarNameChange) {
      onAvatarNameChange(name)
    } else if (!isControlled) {
      storeState.setSelectedAvatarName(name)
    }
  }

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGender, setSelectedGender] = useState<string>(selectedVoice?.gender || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const avatarsPerPage = mode === 'large' ? 12 : 6
  const [visiblePublicCount, setVisiblePublicCount] = useState<number>(avatarsPerPage)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [activeAvatar, setActiveAvatar] = useState<Avatar | null>(null)
  const [publicAvatars, setPublicAvatars] = useState<Avatar[]>(avatarsConfig)
  const [spaceAvatars, setSpaceAvatars] = useState<Avatar[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isUploadingLook, setIsUploadingLook] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [barRect, setBarRect] = useState<{left:number;width:number}>({ left: 0, width: 0 })
  const [hasMultipleRows, setHasMultipleRows] = useState(false)

  useEffect(() => {
    const updateRect = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      setBarRect({ left: rect.left, width: rect.width })
    }
    updateRect()
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, { passive: true })
    return () => {
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect)
    }
  }, [])

  // reference handled in AvatarLookChatbox

  const { activeSpace, lastUsedParameters } = useActiveSpaceStore()

  // Ajouter l'état pour la pagination des looks
  const [currentLookPage, setCurrentLookPage] = useState(1)
  const looksPerPage = mode === 'large' ? 12 : 6

  // Polling pour rafraîchir tant que des thumbnails manquent
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Obtenir tous les tags uniques (espace + publics)
  const allTags = Array.from(new Set([...spaceAvatars, ...publicAvatars].flatMap(avatar => avatar.tags)))

  // Fonction pour trier les avatars avec les derniers utilisés en premier
  const sortAvatarsByLastUsed = (avatarsToSort: Avatar[]) => {
    if (!lastUsedParameters?.avatars) return avatarsToSort;
    
    return [...avatarsToSort].sort((a, b) => {
      // Vérifier si l'avatar a un look dans les derniers utilisés
      const aHasLastUsedLook = a.looks.some(look => look.id && lastUsedParameters.avatars.includes(look.id));
      const bHasLastUsedLook = b.looks.some(look => look.id && lastUsedParameters.avatars.includes(look.id));
      
      if (aHasLastUsedLook && !bHasLastUsedLook) return -1;
      if (!aHasLastUsedLook && bHasLastUsedLook) return 1;
      
      // Si les deux ont des looks utilisés, trier par le plus récent look utilisé
      if (aHasLastUsedLook && bHasLastUsedLook) {
        const aMinIndex = Math.min(...a.looks
          .filter(look => look.id && lastUsedParameters.avatars.includes(look.id))
          .map(look => look.id ? lastUsedParameters.avatars.indexOf(look.id) : Infinity));
        const bMinIndex = Math.min(...b.looks
          .filter(look => look.id && lastUsedParameters.avatars.includes(look.id))
          .map(look => look.id ? lastUsedParameters.avatars.indexOf(look.id) : Infinity));
        return aMinIndex - bMinIndex;
      }
      
      return 0;
    });
  };

  // Fonction pour trier les looks avec les derniers utilisés en premier
  const sortLooksByLastUsed = (looksToSort: AvatarLook[]) => {
    if (!lastUsedParameters?.avatars) return looksToSort;
    
    return [...looksToSort].sort((a, b) => {
      const aIsLastUsed = a.id && lastUsedParameters.avatars.includes(a.id);
      const bIsLastUsed = b.id && lastUsedParameters.avatars.includes(b.id);
      
      if (aIsLastUsed && !bIsLastUsed) return -1;
      if (!aIsLastUsed && bIsLastUsed) return 1;
      
      // Si les deux sont dans lastUsed, trier par ordre d'utilisation (plus récent d'abord)
      if (aIsLastUsed && bIsLastUsed && a.id && b.id) {
        const aIndex = lastUsedParameters.avatars.indexOf(a.id);
        const bIndex = lastUsedParameters.avatars.indexOf(b.id);
        return aIndex - bIndex;
      }
      
      return 0;
    });
  };

  const fetchSpaceAvatars = async (lastUsed? : String | undefined) => {
    if (activeSpace?.id) {
      const spaceAvatarsFetched : Avatar[] = await getSpaceAvatars(activeSpace.id)
      if (spaceAvatarsFetched && spaceAvatarsFetched.length > 0) {
        setSpaceAvatars(spaceAvatarsFetched);
        // Mettre à jour l'activeAvatar pour refléter les dernières thumbnails/looks
        if (activeAvatar?.id) {
          const refreshedActive = spaceAvatarsFetched.find(a => a.id === activeAvatar.id)
          if (refreshedActive) setActiveAvatar(refreshedActive)
        }
        if (lastUsed) {
          const avatar = spaceAvatarsFetched.find((avatar) => avatar.id === lastUsed);
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

  useEffect(() => {

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
}, [activeSpace?.id])

  // Démarrer/arrêter un polling si des thumbnails manquent (ou si on est en génération look)
  useEffect(() => {
    const hasMissingThumbnails = spaceAvatars.some(a => !a.thumbnail || a.looks.some(l => !l.thumbnail || l.thumbnail === ''))

    const startPolling = () => {
      if (pollingRef.current || !activeSpace?.id) return
      pollingRef.current = setInterval(async () => {
        try {
          const latest: Avatar[] = await getSpaceAvatars(activeSpace.id as string)
          setSpaceAvatars(latest)
          // Mettre à jour activeAvatar si présent
          if (activeAvatar?.id) {
            const refreshedActive = latest.find(a => a.id === activeAvatar.id)
            if (refreshedActive) setActiveAvatar(refreshedActive)
          }
          const stillMissing = latest.some(a => !a.thumbnail || a.looks.some(l => !l.thumbnail || l.thumbnail === ''))
          if (!stillMissing && pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        } catch (e) {
          // Stop polling on error to avoid loops; user can trigger manual refresh
          if (pollingRef.current) {
            clearInterval(pollingRef.current)
            pollingRef.current = null
          }
        }
      }, 10000)
    }

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }

    if (hasMissingThumbnails) {
      startPolling()
    } else {
      stopPolling()
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [spaceAvatars, activeSpace?.id])

  // Filtrer les avatars publics
  const filteredPublicAvatars = sortAvatarsByLastUsed(publicAvatars.filter(avatar => {
    const matchesSearch = avatar.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGender = selectedGender === 'all' ? true : avatar.gender === selectedGender
    const matchesTags = selectedTags.length === 0 ? true : selectedTags.every(tag => avatar.tags.includes(tag))
    return matchesSearch && matchesGender && matchesTags
  }))

  // Filtrer les avatars de l'espace
  const filteredSpaceAvatars = sortAvatarsByLastUsed(spaceAvatars.filter(avatar => {
    const matchesSearch = avatar.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGender = selectedGender === 'all' ? true : avatar.gender === selectedGender
    const matchesTags = selectedTags.length === 0 ? true : selectedTags.every(tag => avatar.tags.includes(tag))
    return matchesSearch && matchesGender && matchesTags
  }))

  // Infinite scroll pour avatars publics
  const totalPublicWithNoAvatar = filteredPublicAvatars.length + (variant === 'select' && !activeAvatar && currentPage === 1 && showNoAvatar ? 1 : 0)
  const showNoAvatarCard = variant === 'select' && !activeAvatar && currentPage === 1 && showNoAvatar
  const effectivePublicCount = Math.min(visiblePublicCount, totalPublicWithNoAvatar)
  const numAvatarsToShow = Math.max(0, effectivePublicCount - (showNoAvatarCard ? 1 : 0))
  const currentAvatars = filteredPublicAvatars.slice(0, numAvatarsToShow)
  const totalPages = Math.ceil(filteredPublicAvatars.length / avatarsPerPage)

  // Pour la première vue, inclure éventuellement la carte "No avatar"
  const avatarsToShow = currentAvatars



  // Calculs pour la pagination des looks
  const filteredLooks = activeAvatar ? sortLooksByLastUsed(activeAvatar.looks.filter(look => {
    if (selectedTags.length === 0) return true
    return selectedTags.every(tag => look.tags?.includes(tag) || false)
  })) : []

  const indexOfLastLook = currentLookPage * looksPerPage
  const indexOfFirstLook = indexOfLastLook - looksPerPage
  const currentLooks = filteredLooks.slice(indexOfFirstLook, indexOfLastLook)
  const totalLookPages = Math.ceil(filteredLooks.length / looksPerPage)

  const toggleTag = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag]
    setSelectedTags(newTags)
    handleFilters(filteredPublicAvatars)
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
    const newFilteredAvatars = sortAvatarsByLastUsed(publicAvatars.filter(avatar => {
      const matchesSearch = avatar.name.toLowerCase().includes(query.toLowerCase())
      const matchesGender = selectedGender === 'all' ? true : avatar.gender === selectedGender
      const matchesTags = selectedTags.length === 0 ? true : selectedTags.every(tag => avatar.tags.includes(tag))
      return matchesSearch && matchesGender && matchesTags
    }))
    handleFilters(newFilteredAvatars)
  }

  // Reset du compteur visible quand les filtres changent ou vue change
  useEffect(() => {
    setVisiblePublicCount(avatarsPerPage)
  }, [searchQuery, selectedGender, selectedTags, avatarsPerPage, activeAvatar])

  const hasMorePublic = effectivePublicCount < totalPublicWithNoAvatar
  const loadMorePublic = () => {
    setVisiblePublicCount((c) => c + avatarsPerPage)
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

  // Fonctions pour créer un nouveau look
  const handleFileUpload = () => {
    if (!activeAvatar || !activeSpace?.id) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        setIsUploadingLook(true);
        const { mediaUrl } = await getMediaUrlFromFileByPresignedUrl(file);
        
        // Créer le nouveau look avec l'image
        const response = await fetch(`/api/space/${activeSpace.id}/avatars/${activeAvatar.id}/looks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: mediaUrl,
            lookName: `Look ${activeAvatar.looks.length + 1}`,
            place: "unspecified",
            tags: [],
            format: "vertical"
          }),
        });
        
        if (response.ok) {
          // Rafraîchir la liste des avatars pour afficher le nouveau look
          await fetchSpaceAvatars();
        }
      } catch (error) {
        console.error('Error creating new look:', error);
      } finally {
        setIsUploadingLook(false);
      }
    };
    input.click();
  };

  // chatbox now extracted

  // Compute if the looks grid spans multiple rows to avoid overlap with the fixed chatbox
  useEffect(() => {
    const computeHasMultipleRows = () => {
      if (!activeAvatar) {
        setHasMultipleRows(false)
        return
      }
      const width = window.innerWidth
      let cols = 2
      if (mode === 'large') {
        // grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
        if (width < 768) cols = 2
        else if (width < 1024) cols = 3
        else if (width < 1280) cols = 4
        else cols = 5
      } else {
        // grid-cols-2 md:grid-cols-3 lg:grid-cols-2
        if (width < 768) cols = 2
        else if (width < 1024) cols = 3
        else cols = 2
      }
      // Include the add-look card in the first page rendering
      const itemCount = 1 + currentLooks.length
      const rows = Math.ceil(itemCount / Math.max(cols, 1))
      setHasMultipleRows(rows > 1)
    }
    computeHasMultipleRows()
    window.addEventListener('resize', computeHasMultipleRows)
    return () => window.removeEventListener('resize', computeHasMultipleRows)
  }, [activeAvatar, currentLooks.length, mode])

  return (
    <div className="space-y-4 mt-4" ref={containerRef}>
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
                handleFilters(filteredPublicAvatars)
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
      
      <HorizontalScrollList>
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
      </HorizontalScrollList>

      <div className={`grid gap-4 ${mode === 'large' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-2'} ${activeAvatar ? (hasMultipleRows ? 'pb-40' : 'pb-24') : ''}`}>
        {activeAvatar ? (
          // Afficher les looks de l'avatar sélectionné
          <>
            {/* Carte pour créer un nouveau look */}
            <AddLookCard
              onFileUpload={handleFileUpload}
              isUploading={isUploadingLook}
            />

            {/* Looks existants */}
            {(currentLooks as AvatarLook[]).length > 0 ? (
              (currentLooks as AvatarLook[]).map((look: AvatarLook) => (
                <AvatarLookCard
                  key={look.id}
                  look={look}
                  avatarName={activeAvatar.name}
                  isLastUsed={look.id ? lastUsedParameters?.avatars?.includes(look.id) : false}
                  selectedLook={selectedLook}
                  onLookChange={variant === 'create' ? () => {} : setSelectedLook}
                  onAvatarNameChange={variant === 'create' ? () => {} : setSelectedAvatarName}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {t('no-looks-found')}
              </div>
            )}
          </>
        ) : (
          // Afficher d'abord la section des avatars du space, puis la section des avatars publics
          <>
            <>
              <div className="col-span-full mt-2 mb-1 text-lg font-semibold text-muted-foreground">
                {t('sections.yours')}
              </div>
              {variant === 'create' && (
                <Card 
                  className="relative overflow-hidden rounded-lg cursor-pointer transition-all duration-150"
                  onClick={() => setShowCreateModal(true)}
                >
                  {/* Contenu principal centré */}
                  <div className="w-full aspect-[3/4] relative bg-white flex flex-col items-center justify-center p-4">
                    <Plus className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 text-center font-medium">{t('create-new-name')}</p>
                  </div>

                  {/* Compteur en bas */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 border-t">
                    <div className="text-center">
                      <span className="text-xs text-gray-600">3/5 left</span>
                    </div>
                  </div>
                </Card>
              )}
              {filteredSpaceAvatars.length > 0 && filteredSpaceAvatars.map((avatar: Avatar) => (
                <AvatarCard
                  key={`space-${avatar.id}`}
                  avatar={avatar}
                  onClick={() => setActiveAvatar(avatar)}
                  isLastUsed={avatar.looks.some(look => look.id && lastUsedParameters?.avatars?.includes(look.id))}
                  selectedAvatarName={selectedAvatarName}
                />
              ))}
            </>

            <div className="col-span-full mt-4 mb-1 text-lg font-semibold text-muted-foreground">
              {t('sections.public')}
            </div>
            {showNoAvatarCard && (
              <NoAvatarCard 
                selectedLook={selectedLook || null}
                onLookChange={setSelectedLook}
                onAvatarNameChange={setSelectedAvatarName}
              />
            )}
            {(avatarsToShow as Avatar[]).map((avatar: Avatar) => (
              <AvatarCard
                key={`public-${avatar.id}`}
                avatar={avatar}
                onClick={() => setActiveAvatar(avatar)}
                isLastUsed={avatar.looks.some(look => look.id && lastUsedParameters?.avatars?.includes(look.id))}
                selectedAvatarName={selectedAvatarName}
              />
            ))}
            <div className="col-span-full">
              <InfiniteScroll
                onLoadMore={loadMorePublic}
                hasMore={hasMorePublic}
                loader={<div className="text-center py-4 text-muted-foreground">{tCommon('infinite-scroll.loading')}</div>}
                endMessage={<div className="text-center py-4 text-muted-foreground">{tCommon('infinite-scroll.end')}</div>}
              />
            </div>
          </>
        )}
      </div>

      <CreateAvatarModal 
        isOpen={showCreateModal} 
        onClose={() => {
          setShowCreateModal(false)
          // Rafraîchir la liste des avatars pour afficher le nouvel avatar (même sans thumbnail au début)
          fetchSpaceAvatars()
        }}
        onCreated={(avatar) => {
          // Sélectionner automatiquement l'avatar nouvellement créé et ouvrir ses looks
          setActiveAvatar(avatar)
          setCurrentLookPage(1)
          // Synchroniser les données complètes depuis l'API (thumbnails/looks à jour)
          fetchSpaceAvatars()
        }} 
      />

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
      ) : null}

      {activeAvatar && spaceAvatars.some(a => a.id === activeAvatar.id) && (
        <AvatarLookChatbox
          anchorRef={containerRef}
          activeAvatar={activeAvatar}
          spaceId={activeSpace?.id as string}
          onRefresh={() => fetchSpaceAvatars()}
        />
      )}
    </div>
  )
}
