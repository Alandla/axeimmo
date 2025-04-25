import { useTranslations } from "next-intl";
import { sounds } from "@/src/config/transitions.config";
import { useState } from "react";
import { Check, Play, Pause, Volume1, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/components/ui/pagination"
import { ITransition } from "@/src/types/video";
import { HorizontalScrollList } from "../ui/horizontal-scroll-list";

interface TransitionMusicsProps {
  transition: ITransition;
  transitionIndex: number;
  updateTransition: (transitionIndex: number, newTransition: ITransition) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

export default function TransitionMusics({ 
  transition,
  transitionIndex,
  updateTransition,
  selectedCategories,
  setSelectedCategories
}: TransitionMusicsProps) {
  const t = useTranslations('edit.transition')
  const [currentPage, setCurrentPage] = useState(1);
  const [playingSound, setPlayingSound] = useState<{ name: string, audio: HTMLAudioElement | null }>({ name: '', audio: null });
  const [volume, setVolume] = useState(transition.volume || 1);
  const soundsPerPage = 14;

  // Obtenir toutes les catégories uniques
  const allCategories = Array.from(new Set(sounds.map(s => s.category).filter((category): category is string => typeof category === 'string')));

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    setCurrentPage(1); // Réinitialiser la page lors du changement de catégorie
  };

  // Filtrer les sons selon les catégories sélectionnées
  const filteredSounds = sounds.filter(s => 
    selectedCategories.length === 0 || (typeof s.category === 'string' && selectedCategories.includes(s.category))
  );

  // Calculer les sons pour la page courante
  const indexOfLastSound = currentPage * soundsPerPage;
  const indexOfFirstSound = indexOfLastSound - soundsPerPage;
  const currentSounds = filteredSounds.slice(indexOfFirstSound, indexOfLastSound);
  const totalPages = Math.ceil(filteredSounds.length / soundsPerPage);

  const handleSoundSelect = (soundUrl: string) => {
    const newTransition = {
      ...transition,
      sound: soundUrl,
    };
    updateTransition(transitionIndex, newTransition);
  };

  const handlePreviewSound = (sound: any) => {
    if (playingSound.name === sound.name && playingSound.audio) {
      playingSound.audio.pause();
      setPlayingSound({ name: '', audio: null });
    } else {
      if (playingSound.audio) {
        playingSound.audio.pause();
      }
      const audio = new Audio(sound.url);
      audio.volume = volume;
      setPlayingSound({ name: sound.name, audio });
      audio.play();
      audio.onended = () => setPlayingSound({ name: '', audio: null });
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (playingSound.audio) {
      playingSound.audio.volume = newVolume;
    }
    const newTransition = {
      ...transition,
      volume: newVolume,
    };
    updateTransition(transitionIndex, newTransition);
  };

  // Fonction pour générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pageNumbers = [];
    const totalPagesToShow = 5;
    const halfWay = Math.floor(totalPagesToShow / 2);
    
    let startPage = Math.max(currentPage - halfWay, 1);
    let endPage = Math.min(startPage + totalPagesToShow - 1, totalPages);
    
    if (endPage - startPage + 1 < totalPagesToShow) {
      startPage = Math.max(endPage - totalPagesToShow + 1, 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return {
      numbers: pageNumbers,
      showStartEllipsis: startPage > 1,
      showEndEllipsis: endPage < totalPages
    };
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="flex justify-between mb-4">
          <HorizontalScrollList>
            {allCategories.map(category => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => toggleCategory(category)}
              >
                {selectedCategories.includes(category) && (
                  <Check className="w-3 h-3 mr-1" />
                )}
                {t(`category.${category}`)}
              </Badge>
            ))}
          </HorizontalScrollList>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="ml-2">
              {volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : volume < 0.5 ? (
                <Volume1 className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 p-4">
            <div className="flex items-center gap-2">
              <Slider
                value={[volume]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="flex-1"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round(volume * 100)}
                onChange={(e) => {
                  const value = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                  handleVolumeChange([value / 100]);
                }}
                className="w-16 h-8 text-sm text-center rounded-md border"
              />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {currentSounds.map((sound) => {
          const isSelected = transition.sound === sound.url;
          const isPlaying = playingSound.name === sound.name;

          return (
            <div
              key={sound.name}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border cursor-pointer",
                isSelected && "border-primary"
              )}
              onClick={() => handleSoundSelect(sound.url)}
            >
              <div className="truncate flex-1 mr-4 text-sm">
                {sound.name}
              </div>
              <Button
                variant="outline"
                size="iconSmall"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewSound(sound);
                }}
              >
                {isSelected ? (
                  <Check size={12} />
                ) : isPlaying ? (
                  <Pause size={12} />
                ) : (
                  <Play size={12} />
                )}
              </Button>
            </div>
          );
        })}
      </div>

    <Pagination>
        <PaginationContent>
        <PaginationItem>
            <PaginationPrevious 
            showText={true}
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
            showText={true}
            onClick={() => handlePageChange(currentPage + 1)}
            className={cn(
                "cursor-pointer",
                currentPage === totalPages && "pointer-events-none opacity-50"
            )}
            />
        </PaginationItem>
        </PaginationContent>
    </Pagination>
    </>
  );
} 