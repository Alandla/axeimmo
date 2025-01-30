import { ITransition } from "@/src/types/video";
import { useTranslations } from "next-intl";
import { transitions } from "@/src/config/transitions.config";
import { useEffect, useRef, useState } from "react";
import { Player, PlayerRef } from "@remotion/player";
import { PreviewTransition } from "@/src/remotion/previewTransition/Composition";
import { Check } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Badge } from "../ui/badge";

export default function TransitionListSettings({ video, transition, transitionIndex, spaceId }: { video: any, transition: ITransition, transitionIndex: number, spaceId: string }) {
  const t = useTranslations('edit.transition')
  const [selectedTransition, setSelectedTransition] = useState<ITransition | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Obtenir toutes les catégories uniques
  const allCategories = Array.from(new Set(transitions.map(t => t.category).filter((category): category is string => typeof category === 'string')));

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(newCategories);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Empêche le scroll vertical de la page
    e.preventDefault();
    
    if (e.deltaY !== 0) {
      e.currentTarget.scrollLeft += e.deltaY;
    }
  };

  // Filtrer les transitions selon les catégories sélectionnées
  const filteredTransitions = transitions.filter(t => 
    selectedCategories.length === 0 || (typeof t.category === 'string' && selectedCategories.includes(t.category))
  );

  return (
    <>
      <div 
        className="overflow-x-auto scrollbar-hide mb-4"
        onWheel={handleWheel}
      >
        <div className="flex gap-2">
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
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filteredTransitions.map((transitionItem, index) => {
          const playerRef = useRef<PlayerRef>(null);
          const [isHovering, setIsHovering] = useState(false);

          // Créer une liste de 2 séquences pour la preview
          const previewSequences = video.video.sequences.slice(transition.indexSequenceBefore || 0, (transition.indexSequenceBefore || 0) + 2);

          // Vérifier si cette transition est la transition sélectionnée
          const isSelected = transition.video === transitionItem.video;

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
            <div key={index}>
              <div 
                className={cn(
                  "aspect-square relative overflow-hidden rounded-lg border cursor-pointer",
                  isSelected && "border-primary"
                )}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={() => setSelectedTransition(transitionItem)}
              >
                {isSelected && (
                  <Check className="h-4 w-4 text-primary absolute top-2 right-2 z-10" />
                )}
                <Player
                  ref={playerRef}
                  component={PreviewTransition}
                  durationInFrames={500}
                  compositionWidth={400}
                  compositionHeight={400}
                  fps={60}
                  style={{
                    width: '100%',
                    height: '100%',
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
        })}
      </div>
    </>
  )
}