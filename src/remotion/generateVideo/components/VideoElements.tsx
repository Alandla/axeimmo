import { AbsoluteFill, Img, Video, useCurrentFrame, useVideoConfig, useCurrentScale, OffthreadVideo } from "remotion";
import { useState, useRef, useCallback, useEffect } from "react";
import { IElement, ISequence, IWord } from "@/src/types/video";
import { Button } from "@/src/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Clock, X, Clock9, Clock8 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";

interface VideoElementsProps {
  elements: IElement[];
  sequences: ISequence[];
  onElementPositionChange?: (index: number, position: { x: number, y: number }) => void;
  onElementSizeChange?: (index: number, size: number) => void;
  onElementStartChange?: (index: number, start: number) => void;
  onElementEndChange?: (index: number, end: number) => void;
  onElementMediaChange?: (index: number) => void;
  onElementDelete?: (index: number) => void;
}

const MIN_SIZE = 5; // Taille minimale en pourcentage
const MAX_SIZE = 50; // Taille maximale en pourcentage

export const VideoElements = ({
  elements,
  sequences,
  onElementPositionChange,
  onElementSizeChange,
  onElementStartChange,
  onElementEndChange,
  onElementMediaChange,
  onElementDelete,
}: VideoElementsProps) => {
  const { width: compositionWidth, height: compositionHeight } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTime = frame / 60; // Assuming 60 fps
  const scale = useCurrentScale();

  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mouseDownTime, setMouseDownTime] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const [hoveredElementIndex, setHoveredElementIndex] = useState<number | null>(null);
  const [naturalRatios, setNaturalRatios] = useState<{ [key: number]: number }>({});
  const elementRefs = useRef<(HTMLDivElement | null)[]>([]);
  const playerElementRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const findPlayerElement = useCallback(() => {
    if (playerElementRef.current) {
      return playerElementRef.current;
    }
    let el = elementRefs.current[0];
    let parent: HTMLElement | null = el?.parentElement || null;
    while (parent && !parent.classList.contains("__remotion-player")) {
      parent = parent.parentElement;
    }
    playerElementRef.current = parent;
    return parent;
  }, []);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showMenu &&
        selectedElementIndex !== null &&
        elementRefs.current[selectedElementIndex] &&
        !elementRefs.current[selectedElementIndex]?.contains(event.target as Node) &&
        (!menuRef.current || !menuRef.current.contains(event.target as Node))
      ) {
        setShowMenu(false);
        setSelectedElementIndex(null);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu, selectedElementIndex]);

  const handleElementClick = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si on a bougé ou si on est en train de drag, ne pas ouvrir le menu
    if (hasMoved || isDragging) return;
    
    // Vérifier que c'est un clic rapide (pas un drag)
    const clickDuration = Date.now() - mouseDownTime;
    if (clickDuration > 200) return; // Plus de 200ms = probablement un drag
    
    setSelectedElementIndex(index);
    setShowMenu(true);
  }, [hasMoved, isDragging, mouseDownTime]);

  const handleElementMouseEnter = useCallback((index: number) => {
    setHoveredElementIndex(index);
  }, []);

  const handleElementMouseLeave = useCallback(() => {
    setHoveredElementIndex(null);
  }, []);

  const startDragging = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      
      setMouseDownTime(Date.now());
      setHasMoved(false);
      
      const playerElement = findPlayerElement();
      if (!playerElement) return;
      const playerRect = playerElement.getBoundingClientRect();
      const elementRect = elementRefs.current[index]?.getBoundingClientRect();
      if (!elementRect) return;

      const element = elements[index];
      const elementCenterX = elementRect.left + elementRect.width / 2;
      const elementCenterY = elementRect.top + elementRect.height / 2;
      const offsetX = e.clientX - elementCenterX;
      const offsetY = e.clientY - elementCenterY;

      let animationFrameId: number;
      let lastUpdateTime = 0;
      const THROTTLE_MS = 16; // ~60fps

      const onMouseMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();
        setHasMoved(true);

        const now = performance.now();
        if (now - lastUpdateTime < THROTTLE_MS) {
          return;
        }
        lastUpdateTime = now;

        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
          const playerRectMove = playerElement.getBoundingClientRect();
          const elementRectMove = elementRefs.current[index]?.getBoundingClientRect();
          if (!elementRectMove) return;

          let newCenterX = moveEvent.clientX - playerRectMove.left - offsetX;
          let newCenterY = moveEvent.clientY - playerRectMove.top - offsetY;
          const scaleX = compositionWidth / playerRectMove.width;
          const scaleY = compositionHeight / playerRectMove.height;
          let compositionX = newCenterX * scaleX;
          let compositionY = newCenterY * scaleY;
          
          // Allow elements to be positioned anywhere from 0% to 100%
          // No constraints based on element size - let users position freely
          compositionX = Math.max(0, Math.min(compositionX, compositionWidth));
          compositionY = Math.max(0, Math.min(compositionY, compositionHeight));

          const newPosition = {
            x: (compositionX / compositionWidth) * 100,
            y: (compositionY / compositionHeight) * 100,
          };

          if (onElementPositionChange) {
            onElementPositionChange(index, newPosition);
          }
        });
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        upEvent.stopPropagation();
        setIsDragging(false);
        // Afficher le menu à la fin si pas déjà affiché
        if (!showMenu) {
          setSelectedElementIndex(index);
          setShowMenu(true);
        }
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        window.removeEventListener("pointermove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      setShowMenu(false);
      setIsDragging(true);
      window.addEventListener("pointermove", onMouseMove, { passive: false });
      window.addEventListener("mouseup", onMouseUp, { passive: false });
    },
    [findPlayerElement, compositionWidth, compositionHeight, elements, onElementPositionChange]
  );

  type HandleType = "top-left" | "top-right" | "bottom-left" | "bottom-right";

  const startResizing = useCallback(
    (e: React.MouseEvent, index: number, handle: HandleType) => {
      e.preventDefault();
      e.stopPropagation();
      
      setMouseDownTime(Date.now());
      setHasMoved(false);
      
      const playerElement = findPlayerElement();
      if (!playerElement) return;
      const playerRect = playerElement.getBoundingClientRect();
      const element = elements[index];
      const initialSize = element.size;

      const centerXComp = (element.position.x / 100) * compositionWidth;
      const centerYComp = (element.position.y / 100) * compositionHeight;

      const toCompX = (e.clientX - playerRect.left) * (compositionWidth / playerRect.width);
      const toCompY = (e.clientY - playerRect.top) * (compositionHeight / playerRect.height);
      const initialDistance = Math.max(1, Math.hypot(toCompX - centerXComp, toCompY - centerYComp));

      let animationFrameId: number;
      let lastUpdateTime = 0;
      const THROTTLE_MS = 16;

      const onMouseMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();
        setHasMoved(true);

        const now = performance.now();
        if (now - lastUpdateTime < THROTTLE_MS) {
          return;
        }
        lastUpdateTime = now;

        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }

        animationFrameId = requestAnimationFrame(() => {
          const pointerXComp = (moveEvent.clientX - playerRect.left) * (compositionWidth / playerRect.width);
          const pointerYComp = (moveEvent.clientY - playerRect.top) * (compositionHeight / playerRect.height);

          const currentDistance = Math.max(1, Math.hypot(pointerXComp - centerXComp, pointerYComp - centerYComp));
          const scaleFactor = currentDistance / initialDistance;

          let newSize = initialSize * scaleFactor;
          newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newSize));

          if (onElementSizeChange) {
            onElementSizeChange(index, newSize);
          }
        });
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        upEvent.stopPropagation();
        setIsResizing(false);
        // Afficher le menu à la fin si pas déjà affiché
        if (!showMenu) {
          setSelectedElementIndex(index);
          setShowMenu(true);
        }
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        window.removeEventListener("pointermove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      setShowMenu(false);
      setIsResizing(true);
      window.addEventListener("pointermove", onMouseMove, { passive: false });
      window.addEventListener("mouseup", onMouseUp, { passive: false });
    },
    [findPlayerElement, compositionWidth, compositionHeight, elements, onElementSizeChange]
  );

  // Obtenir tous les mots avec leurs timings pour les menus Start/End
  const getWordsForStartMenu = (element: IElement) => {
    const items: ({ type: 'separator'; sequenceIndex: number } | { type: 'word'; word: IWord; sequenceIndex: number })[] = [];
    
    sequences.forEach((sequence, sequenceIndex) => {
      const validWords = sequence.words.filter(word => word.start < element.end);
      if (validWords.length > 0) {
        items.push({ type: 'separator', sequenceIndex });
        validWords.forEach((word) => {
          items.push({ type: 'word', word, sequenceIndex });
        });
      }
    });
    return items;
  };

  const getWordsForEndMenu = (element: IElement) => {
    const items: ({ type: 'separator'; sequenceIndex: number } | { type: 'word'; word: IWord; sequenceIndex: number })[] = [];
    
    sequences.forEach((sequence, sequenceIndex) => {
      const validWords = sequence.words.filter(word => word.end > element.start);
      if (validWords.length > 0) {
        items.push({ type: 'separator', sequenceIndex });
        validWords.forEach((word) => {
          items.push({ type: 'word', word, sequenceIndex });
        });
      }
    });
    return items;
  };

  // Créer les valeurs pour les selects
  const createSelectValue = (word: IWord, sequenceIndex: number) => {
    return `${sequenceIndex}-${word.start}-${word.end}`;
  };

  const parseSelectValue = (value: string) => {
    const [sequenceIndex, start, end] = value.split('-');
    return {
      sequenceIndex: parseInt(sequenceIndex),
      start: parseFloat(start),
      end: parseFloat(end)
    };
  };



  return (
    <AbsoluteFill>
      {/* Conteneur avec overflow hidden pour les médias seulement */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {elements.map((element, index) => {
          // Vérifier si l'élément doit être visible à ce moment
          if (currentTime < element.start || currentTime > element.end) {
            return null;
          }

          // Calculer le ratio à la volée avec les dimensions du média ou ratio par défaut
          let naturalRatio = 1; // Ratio par défaut (carré)
          if (naturalRatios[index]) {
            naturalRatio = naturalRatios[index];
          } else if (element.media.type === 'image' && element.media.image?.width && element.media.image?.height) {
            naturalRatio = element.media.image.height / element.media.image.width;
          } else if (element.media.type === 'video' && element.media.video?.width && element.media.video?.height) {
            naturalRatio = element.media.video.height / element.media.video.width;
          }
          
          const elementWidth = compositionWidth * (element.size / 100);
          const elementHeight = elementWidth * naturalRatio;

          return (
            <div key={`media-${index}`}>
              {/* L'élément média */}
              {element.media.type === 'image' && element.media.image ? (
                <Img
                  src={element.media.image.link}
                  style={{
                    position: "absolute",
                    width: `${elementWidth}px`,
                    height: `${elementHeight}px`,
                    left: `${(element.position.x / 100) * compositionWidth - elementWidth / 2}px`,
                    top: `${(element.position.y / 100) * compositionHeight - elementHeight / 2}px`,
                    pointerEvents: "none",
                    zIndex: 100 + index,
                    objectFit: "cover",
                  }}
                  onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    if (img && img.naturalWidth) {
                      setNaturalRatios(prev => ({
                        ...prev,
                        [index]: img.naturalHeight / img.naturalWidth
                      }));
                    }
                  }}
                />
              ) : element.media.type === 'video' && element.media.video ? (
                <OffthreadVideo
                  src={element.media.video.link}
                  style={{
                    position: "absolute",
                    width: `${elementWidth}px`,
                    height: `${elementHeight}px`,
                    left: `${(element.position.x / 100) * compositionWidth - elementWidth / 2}px`,
                    top: `${(element.position.y / 100) * compositionHeight - elementHeight / 2}px`,
                    pointerEvents: "none",
                    zIndex: 100 + index,
                    objectFit: "cover",
                  }}
                  muted
                  startFrom={(element.media.startAt || 0) * 60}
                  endAt={(element.media.startAt || 0) * 60 + element.durationInFrames}
                />
              ) : null}
            </div>
          );
        })}
      </AbsoluteFill>

      {/* Conteneur pour les overlays et menus sans overflow hidden */}
      {elements.map((element, index) => {
        // Vérifier si l'élément doit être visible à ce moment
        if (currentTime < element.start || currentTime > element.end) {
          return null;
        }

        const isSelected = selectedElementIndex === index;
        const isHovered = hoveredElementIndex === index;
        
        // Calculer le ratio à la volée avec les dimensions du média ou ratio par défaut
        let naturalRatio = 1; // Ratio par défaut (carré)
        if (naturalRatios[index]) {
          naturalRatio = naturalRatios[index];
        } else if (element.media.type === 'image' && element.media.image?.width && element.media.image?.height) {
          naturalRatio = element.media.image.height / element.media.image.width;
        } else if (element.media.type === 'video' && element.media.video?.width && element.media.video?.height) {
          naturalRatio = element.media.video.height / element.media.video.width;
        }
        
        const elementWidth = compositionWidth * (element.size / 100);
        const elementHeight = elementWidth * naturalRatio;
        const outlineBorder = Math.ceil(2 / Math.max(0.0001, scale));

        const elementStyle: React.CSSProperties = {
          position: "absolute",
          left: `${(element.position.x / 100) * compositionWidth - elementWidth / 2}px`,
          top: `${(element.position.y / 100) * compositionHeight - elementHeight / 2}px`,
          width: `${elementWidth}px`,
          height: `${elementHeight}px`,
          outline: ((isHovered && !isResizing) || isSelected) ? `${outlineBorder}px solid #0B84F3` : undefined,
          userSelect: "none",
          touchAction: "none",
          cursor: isDragging ? "grabbing" : isHovered ? "grab" : "pointer",
          zIndex: 100 + index,
        };

        const handleSize = Math.max(6, Math.round(8 / Math.max(0.0001, scale)));
        const handleBorder = 1 / Math.max(0.0001, scale);

        const sharedHandleStyle: React.CSSProperties = {
          position: "absolute",
          width: handleSize,
          height: handleSize,
          backgroundColor: "white",
          border: `${handleBorder}px solid #0B84F3`,
          borderRadius: 2,
        };

        return (
          <div key={`overlay-${index}`}>

            {/* Overlay de sélection */}
            <div
              ref={(el) => {
                elementRefs.current[index] = el;
              }}
              style={elementStyle}
              onMouseDown={(e) => startDragging(e, index)}
              onClick={(e) => handleElementClick(e, index)}
              onMouseEnter={() => handleElementMouseEnter(index)}
              onMouseLeave={handleElementMouseLeave}
            >
              {/* Poignées de redimensionnement */}
              {((isHovered && !isResizing) || isSelected) && (
                <>
                  <div
                    style={{
                      ...sharedHandleStyle,
                      left: 0,
                      top: 0,
                      transform: "translate(-50%, -50%)",
                      cursor: "nwse-resize",
                    }}
                    onMouseDown={(ev) => startResizing(ev, index, "top-left")}
                  />
                  <div
                    style={{
                      ...sharedHandleStyle,
                      left: "100%",
                      top: 0,
                      transform: "translate(-50%, -50%)",
                      cursor: "nesw-resize",
                    }}
                    onMouseDown={(ev) => startResizing(ev, index, "top-right")}
                  />
                  <div
                    style={{
                      ...sharedHandleStyle,
                      left: 0,
                      top: "100%",
                      transform: "translate(-50%, -50%)",
                      cursor: "nesw-resize",
                    }}
                    onMouseDown={(ev) => startResizing(ev, index, "bottom-left")}
                  />
                  <div
                    style={{
                      ...sharedHandleStyle,
                      left: "100%",
                      top: "100%",
                      transform: "translate(-50%, -50%)",
                      cursor: "nwse-resize",
                    }}
                    onMouseDown={(ev) => startResizing(ev, index, "bottom-right")}
                  />
                </>
              )}

              {/* Menu flottant */}
              {showMenu && isSelected && (
                <div
                  ref={menuRef}
                  onMouseDown={(ev) => ev.stopPropagation()}
                  onClick={(ev) => ev.stopPropagation()}
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: 0,
                    transform: `translate(-50%, -100%) translateY(-${15 / Math.max(0.0001, scale)}px)`,
                    zIndex: 1002,
                  }}
                >
                  <div
                    style={{
                      transform: `scale(${1 / Math.max(0.0001, scale)})`,
                      transformOrigin: "bottom center",
                    }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="bg-white border shadow-lg rounded-md p-1"
                    >
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => onElementMediaChange?.(index)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>

                      <div className="w-px h-4 bg-border mx-1"></div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-1 mr-1">
                            {element.start.toFixed(2)}s
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          className="overflow-y-auto overflow-x-hidden"
                          style={{ maxHeight: '240px' }}
                        >
                          {getWordsForStartMenu(element).map((item, itemIndex) => {
                            if (item.type === 'separator') {
                              return (
                                <div
                                  key={`separator-${item.sequenceIndex}`}
                                  className="px-2 py-1 text-xs text-muted-foreground font-medium"
                                >
                                  Sequence {item.sequenceIndex + 1}
                                </div>
                              );
                            } else {
                              const isSelected = Math.abs(item.word.start - element.start) < 0.01;
                              return (
                                <DropdownMenuItem
                                  key={`word-${item.sequenceIndex}-${itemIndex}`}
                                  className={cn(
                                    "cursor-pointer text-xs flex justify-between",
                                    isSelected && "bg-accent text-accent-foreground"
                                  )}
                                  onClick={() => onElementStartChange?.(index, item.word.start)}
                                >
                                  <span>{item.word.word}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {item.word.start.toFixed(2)}s
                                  </span>
                                </DropdownMenuItem>
                              );
                            }
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <span>-</span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-1 ml-1">
                            {element.end.toFixed(2)}s
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          className="overflow-y-auto overflow-x-hidden"
                          style={{ maxHeight: '240px' }}
                        >
                          {getWordsForEndMenu(element).map((item, itemIndex) => {
                            if (item.type === 'separator') {
                              return (
                                <div
                                  key={`separator-${item.sequenceIndex}`}
                                  className="px-2 py-1 text-xs text-muted-foreground font-medium"
                                >
                                  Sequence {item.sequenceIndex + 1}
                                </div>
                              );
                            } else {
                              const isSelected = Math.abs(item.word.end - element.end) < 0.01;
                              return (
                                <DropdownMenuItem
                                  key={`word-${item.sequenceIndex}-${itemIndex}`}
                                  className={cn(
                                    "cursor-pointer text-xs flex justify-between",
                                    isSelected && "bg-accent text-accent-foreground"
                                  )}
                                  onClick={() => onElementEndChange?.(index, item.word.end)}
                                >
                                  <span>{item.word.word}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {item.word.end.toFixed(2)}s
                                  </span>
                                </DropdownMenuItem>
                              );
                            }
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="w-px h-4 bg-border mx-1"></div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:bg-red-200 hover:text-destructive"
                        onClick={() => onElementDelete?.(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    </motion.div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
