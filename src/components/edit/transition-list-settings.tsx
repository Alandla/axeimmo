import { ITransition } from "@/src/types/video";
import { useTranslations } from "next-intl";
import { transitions } from "@/src/config/transitions.config";
import { useEffect, useRef, useState } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { PreviewTransition } from "@/src/remotion/previewTransition/Composition";
import { Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Badge } from "../ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/src/components/ui/pagination"

interface TransitionPreviewProps {
  transitionItem: ITransition;
  isSelected: boolean;
  previewSequences: any[];
  video: any;
  onSelect: () => void;
}

function TransitionPreview({ transitionItem, isSelected, previewSequences, video, onSelect }: TransitionPreviewProps) {
  const playerRef = useRef<PlayerRef>(null);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    if (playerRef.current) {
      if (isHovering) {
        playerRef.current.play();
      } else {
        playerRef.current.seekTo(5);
        playerRef.current.pause();
      }
    }
  }, [isHovering]);

  return (
    <div className="relative w-full pt-[100%]">
      <div 
        className={cn(
          "absolute inset-0 border rounded-lg overflow-hidden hover:cursor-pointer",
          isSelected && "border-primary"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={onSelect}
      >
        {isSelected && (
          <Check className="h-4 w-4 text-primary absolute top-2 right-2 z-10" />
        )}
        <Player
          ref={playerRef}
          component={PreviewTransition}
          durationInFrames={(transitionItem.durationInFrames || 500) + 30 + (transitionItem.fullAt || 0)}
          compositionWidth={400}
          compositionHeight={400}
          fps={60}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0,
          }}
          inputProps={{
            data: {
              video: {
                ...video.video,
                sequences: previewSequences
              }
            },
            transition: transitionItem
          }}
          loop
          controls={false}
        />
      </div>
    </div>
  );
}

interface TransitionListSettingsProps {
  video: any;
  transition: ITransition;
  transitionIndex: number;
  spaceId: string;
  updateTransition: (transitionIndex: number, newTransition: ITransition) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
}

export default function TransitionListSettings({ 
  video, 
  transition, 
  transitionIndex, 
  spaceId,
  updateTransition,
  selectedCategories,
  setSelectedCategories
}: TransitionListSettingsProps) {
  const t = useTranslations('edit.transition')
  const [currentPage, setCurrentPage] = useState(1);
  const transitionsPerPage = 12;

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // Obtenir toutes les catégories uniques
  const allCategories = Array.from(new Set(transitions.map(t => t.category).filter((category): category is string => typeof category === 'string')));

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
    setCurrentPage(1); // Réinitialiser la page lors du changement de catégorie
  };

  // Filtrer les transitions selon les catégories sélectionnées
  const filteredTransitions = transitions.filter(t => 
    selectedCategories.length === 0 || (typeof t.category === 'string' && selectedCategories.includes(t.category))
  );

  // Calculer les transitions pour la page courante
  const indexOfLastTransition = currentPage * transitionsPerPage;
  const indexOfFirstTransition = indexOfLastTransition - transitionsPerPage;
  const currentTransitions = filteredTransitions.slice(indexOfFirstTransition, indexOfLastTransition);
  const totalPages = Math.ceil(filteredTransitions.length / transitionsPerPage);

  const handleTransitionSelect = (transitionItem: ITransition) => {
    const newTransition = {
      ...transition,
      video: transitionItem.video,
      thumbnail: transitionItem.thumbnail,
      fullAt: transitionItem.fullAt,
      durationInFrames: transitionItem.durationInFrames,
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
    <div className="w-full">
      <div className="w-full overflow-hidden">
        <div 
          className="w-full overflow-x-auto scrollbar-hide mb-4"
          onWheel={handleWheel}
        >
          <div className="flex gap-2 flex-nowrap">
            {allCategories.map(category => (
              <Badge
                key={category}
                variant={selectedCategories.includes(category) ? "default" : "outline"}
                className="cursor-pointer shrink-0 whitespace-nowrap"
                onClick={() => toggleCategory(category)}
              >
                {selectedCategories.includes(category) && (
                  <Check className="w-3 h-3 mr-1" />
                )}
                {t(`category.${category}`)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {currentTransitions.map((transitionItem, index) => {
              const previewSequences = video.video.sequences.slice(transition.indexSequenceBefore || 0, (transition.indexSequenceBefore || 0) + 2);
              const isSelected = transition.video === transitionItem.video;

              return (
                <TransitionPreview
                  key={index}
                  transitionItem={transitionItem}
                  isSelected={isSelected}
                  previewSequences={previewSequences}
                  video={video}
                  onSelect={() => handleTransitionSelect(transitionItem)}
                />
              );
            })}
          </div>
        </div>

        <div className="w-full">
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
        </div>
      </div>
    </div>
  );
}