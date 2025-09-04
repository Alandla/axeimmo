import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, useCurrentScale, OffthreadVideo, Sequence, getRemotionEnvironment } from "remotion";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { IElement, ISequence } from "../type/video";
import { VideoElementMenu } from "../../../components/ui/video-element-menu";
import { useRotateCursor } from "../../../hooks/use-rotate-cursor";

interface VideoElementsProps {
  elements: IElement[];
  sequences: ISequence[];
  onElementPositionChange?: (index: number, position: { x: number, y: number }) => void;
  onElementSizeChange?: (index: number, size: number) => void;
  onElementRotationChange?: (index: number, rotation: number) => void;
  onElementStartChange?: (index: number, start: number) => void;
  onElementEndChange?: (index: number, end: number) => void;
  onElementMediaChange?: (index: number) => void;
  onElementDelete?: (index: number) => void;
  onElementReorder?: (fromIndex: number, toIndex: number) => void;
}

const MIN_SIZE = 5; // Taille minimale en pourcentage
const MAX_SIZE = 100; // Taille maximale en pourcentage

export const VideoElements = ({
  elements,
  sequences,
  onElementPositionChange,
  onElementSizeChange,
  onElementRotationChange,
  onElementStartChange,
  onElementEndChange,
  onElementMediaChange,
  onElementDelete,
  onElementReorder,
}: VideoElementsProps) => {
  const { width: compositionWidth, height: compositionHeight, fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const scale = useCurrentScale();

  const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
  const [selectedElementRef, setSelectedElementRef] = useState<IElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [mouseDownTime, setMouseDownTime] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);
  const [hoveredElementIndex, setHoveredElementIndex] = useState<number | null>(null);
  const [hoveredRotationZone, setHoveredRotationZone] = useState<number | null>(null);
  const [hoveredRotationCorner, setHoveredRotationCorner] = useState<string | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<number | null>(null);

  // Calculer l'angle de rotation du curseur selon la zone survolée ET la rotation de l'élément
  const getCursorRotation = () => {
    if (!hoveredRotationCorner || hoveredRotationZone === null) return 0;
    
    const element = elements[hoveredRotationZone];
    const elementRotation = element?.rotation || 0;
    
    // Angle de base du coin par rapport à l'élément non tourné
    let baseAngle = 0;
    if (hoveredRotationCorner === 'top-right') baseAngle = -45;
    if (hoveredRotationCorner === 'bottom-right') baseAngle = 45;
    if (hoveredRotationCorner === 'top-left') baseAngle = -135;
    if (hoveredRotationCorner === 'bottom-left') baseAngle = 135;
    
    // Ajouter la rotation de l'élément pour que le curseur suive l'orientation
    return baseAngle + elementRotation;
  };
  
  const rotateCursor = useRotateCursor(getCursorRotation());
  
  // Fonction utilitaire pour calculer le curseur de resize
  const getResizeCursorForDirection = (direction: 'nw' | 'ne' | 'sw' | 'se', rotation: number) => {
    // Normaliser l'angle de rotation entre 0 et 360
    let normalizedAngle = ((rotation % 360) + 360) % 360;
    
    // Calculer l'angle total en ajoutant l'angle de base de la direction
    let baseAngle = 0;
    switch (direction) {
      case 'nw': baseAngle = 315; break; // Nord-Ouest (315°)
      case 'ne': baseAngle = 45; break;  // Nord-Est (45°)
      case 'sw': baseAngle = 225; break; // Sud-Ouest (225°)
      case 'se': baseAngle = 135; break; // Sud-Est (135°)
    }
    
    // Ajouter la rotation de l'élément
    let totalAngle = (baseAngle + normalizedAngle) % 360;
    
    // Déterminer le curseur approprié selon l'angle total
    // Utiliser les curseurs bidirectionnels avec double flèche
    if (totalAngle >= 337.5 || totalAngle < 22.5) {
      return 'ns-resize'; // Nord-Sud
    } else if (totalAngle >= 22.5 && totalAngle < 67.5) {
      return 'nesw-resize'; // Nord-Est/Sud-Ouest
    } else if (totalAngle >= 67.5 && totalAngle < 112.5) {
      return 'ew-resize'; // Est-Ouest
    } else if (totalAngle >= 112.5 && totalAngle < 157.5) {
      return 'nwse-resize'; // Nord-Ouest/Sud-Est
    } else if (totalAngle >= 157.5 && totalAngle < 202.5) {
      return 'ns-resize'; // Sud-Nord
    } else if (totalAngle >= 202.5 && totalAngle < 247.5) {
      return 'nesw-resize'; // Sud-Ouest/Nord-Est
    } else if (totalAngle >= 247.5 && totalAngle < 292.5) {
      return 'ew-resize'; // Ouest-Est
    } else {
      return 'nwse-resize'; // Nord-Ouest/Sud-Est
    }
  };
  const [naturalRatios, setNaturalRatios] = useState<{ [key: number]: number }>({});

  // Calculer les éléments qui se chevauchent dans le temps (memoized pour optimisation)
  const overlappingElements = useMemo(() => {
    const overlaps: { [key: number]: IElement[] } = {};
    
    elements.forEach((element, index) => {
      const overlapping = elements.filter((otherElement, otherIndex) => {
        if (index === otherIndex) return false;
        
        // Vérifier si les intervalles se chevauchent
        return !(element.end <= otherElement.start || element.start >= otherElement.end);
      });
      
      overlaps[index] = overlapping;
    });
    
    return overlaps;
  }, [elements]);

  // Maintenir la sélection sur le même élément après réorganisation
  useEffect(() => {
    if (selectedElementRef) {
      const newIndex = elements.findIndex(el => el === selectedElementRef);
      if (newIndex !== -1 && newIndex !== selectedElementIndex) {
        setSelectedElementIndex(newIndex);
      } else if (newIndex === -1) {
        // L'élément a été supprimé
        setSelectedElementIndex(null);
        setSelectedElementRef(null);
        setShowMenu(false);
      }
    }
  }, [elements, selectedElementRef, selectedElementIndex]);
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
        selectedElementIndex < elements.length &&
        elementRefs.current[selectedElementIndex] &&
        !elementRefs.current[selectedElementIndex]?.contains(event.target as Node) &&
        (!menuRef.current || !menuRef.current.contains(event.target as Node))
      ) {
        setShowMenu(false);
        setSelectedElementIndex(null);
        setSelectedElementRef(null);
        // Reset all interaction states to prevent stuck cursors and behaviors
        setIsDragging(false);
        setIsResizing(false);
        setIsRotating(false);
        setHasMoved(false);
        setHoveredElementIndex(null);
        setHoveredRotationZone(null);
        setHoveredRotationCorner(null);
        setHoveredHandle(null);
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
    setSelectedElementRef(elements[index]);
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
          setSelectedElementRef(elements[index]);
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

  const startRotating = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      
      setMouseDownTime(Date.now());
      setHasMoved(false);
      
      const playerElement = findPlayerElement();
      if (!playerElement) return;
      const playerRect = playerElement.getBoundingClientRect();
      const element = elements[index];
      
      const centerXComp = (element.position.x / 100) * compositionWidth;
      const centerYComp = (element.position.y / 100) * compositionHeight;
      
      let initialRotation = element.rotation || 0;
      
      // Helper function to snap angle to nearest 15° increment
      const snapToFifteen = (angle: number) => {
        return Math.round(angle / 15) * 15;
      };
      
      // If Shift key is pressed at the start, snap to nearest 15° immediately
      if (e.shiftKey) {
        const snappedRotation = snapToFifteen(initialRotation);
        if (snappedRotation !== initialRotation) {
          if (onElementRotationChange) {
            onElementRotationChange(index, snappedRotation);
          }
          initialRotation = snappedRotation;
        }
      }
      
      // Calculer l'angle initial par rapport au centre
      const toCompX = (e.clientX - playerRect.left) * (compositionWidth / playerRect.width);
      const toCompY = (e.clientY - playerRect.top) * (compositionHeight / playerRect.height);
      const initialAngle = Math.atan2(toCompY - centerYComp, toCompX - centerXComp) * (180 / Math.PI);

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
          
          const currentAngle = Math.atan2(pointerYComp - centerYComp, pointerXComp - centerXComp) * (180 / Math.PI);
          const angleDiff = currentAngle - initialAngle;
          
          let newRotation = initialRotation + angleDiff;
          
          // Check if Shift key is pressed for snapping to 15° increments
          if (moveEvent.shiftKey) {
            newRotation = snapToFifteen(newRotation);
          }
          
          // Normaliser l'angle entre -180 et 180
          while (newRotation > 180) newRotation -= 360;
          while (newRotation < -180) newRotation += 360;

          if (onElementRotationChange) {
            onElementRotationChange(index, newRotation);
          }
        });
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        upEvent.stopPropagation();
        setIsRotating(false);
        
        // Réafficher le menu après la rotation
        setSelectedElementIndex(index);
        setSelectedElementRef(elements[index]);
        setShowMenu(true);
        
        // Vérifier si on est encore sur une zone de rotation après le relâchement
        const elementUnderMouse = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
        const isStillOverRotationZone = elementUnderMouse?.closest('[data-rotation-zone]');
        
        if (!isStillOverRotationZone) {
          setHoveredRotationZone(null);
          setHoveredRotationCorner(null);
        }
        
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        window.removeEventListener("pointermove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      setShowMenu(false);
      setIsRotating(true);
      window.addEventListener("pointermove", onMouseMove, { passive: false });
      window.addEventListener("mouseup", onMouseUp, { passive: false });
    },
    [findPlayerElement, compositionWidth, compositionHeight, elements, onElementRotationChange]
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
          setSelectedElementRef(elements[index]);
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





  // Helper function to render element media
  const renderElementMedia = (element: IElement, index: number) => {
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

    const mediaStyle: React.CSSProperties = {
      position: "absolute",
      width: `${elementWidth}px`,
      height: `${elementHeight}px`,
      left: `${(element.position.x / 100) * compositionWidth - elementWidth / 2}px`,
      top: `${(element.position.y / 100) * compositionHeight - elementHeight / 2}px`,
      pointerEvents: "none",
      zIndex: 5 + index, // Z-index basé sur l'ordre dans le tableau (éléments plus tard = plus haut)
      objectFit: "cover",
      transform: `rotate(${element.rotation || 0}deg)`,
      transformOrigin: "center center",
    };

    if (element.media.type === 'image' && element.media.image) {
      return (
        <Img
          src={element.media.image.link}
          style={mediaStyle}
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
      );
    } else if (element.media.type === 'video' && element.media.video) {
      return (
        <OffthreadVideo
          src={element.media.video.link}
          style={mediaStyle}
          muted
          startFrom={(element.media.startAt || 0) * fps}
        />
      );
    }
    return null;
  };

  // Helper function to render element overlay
  const renderElementOverlay = (element: IElement, index: number) => {
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
      cursor: isDragging ? "grabbing" : 
              isRotating ? "grabbing" :
              hoveredHandle === index ? "pointer" : // Les poignées ont priorité
              hoveredRotationZone === index ? rotateCursor :
              isHovered ? "grab" : "pointer",
      zIndex: 5 + index, // Z-index basé sur l'ordre dans le tableau (éléments plus tard = plus haut)
      transform: `rotate(${element.rotation || 0}deg)`,
      transformOrigin: "center center",
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
                cursor: getResizeCursorForDirection('nw', element.rotation || 0),
                zIndex: 8, // Plus haut que les zones de rotation mais sous les sous-titres
              }}
              onMouseEnter={() => {
                setHoveredHandle(index);
              }}
              onMouseLeave={() => {
                setHoveredHandle(null);
              }}
              onMouseDown={(ev) => startResizing(ev, index, "top-left")}
            />
            <div
              style={{
                ...sharedHandleStyle,
                left: "100%",
                top: 0,
                transform: "translate(-50%, -50%)",
                cursor: getResizeCursorForDirection('ne', element.rotation || 0),
                zIndex: 8, // Plus haut que les zones de rotation mais sous les sous-titres
              }}
              onMouseEnter={() => {
                setHoveredHandle(index);
              }}
              onMouseLeave={() => {
                setHoveredHandle(null);
              }}
              onMouseDown={(ev) => startResizing(ev, index, "top-right")}
            />
            <div
              style={{
                ...sharedHandleStyle,
                left: 0,
                top: "100%",
                transform: "translate(-50%, -50%)",
                cursor: getResizeCursorForDirection('sw', element.rotation || 0),
                zIndex: 8, // Plus haut que les zones de rotation mais sous les sous-titres
              }}
              onMouseEnter={() => {
                setHoveredHandle(index);
              }}
              onMouseLeave={() => {
                setHoveredHandle(null);
              }}
              onMouseDown={(ev) => startResizing(ev, index, "bottom-left")}
            />
            <div
              style={{
                ...sharedHandleStyle,
                left: "100%",
                top: "100%",
                transform: "translate(-50%, -50%)",
                cursor: getResizeCursorForDirection('se', element.rotation || 0),
                zIndex: 8, // Plus haut que les zones de rotation mais sous les sous-titres
              }}
              onMouseEnter={() => {
                setHoveredHandle(index);
              }}
              onMouseLeave={() => {
                setHoveredHandle(null);
              }}
              onMouseDown={(ev) => startResizing(ev, index, "bottom-right")}
            />
          </>
        )}

        {/* Zones de rotation autour des poignées */}
        {((isHovered && !isResizing && !isRotating) || isSelected) && (
          <>
            {/* Zone de rotation coin supérieur gauche - zone étendue vers l'extérieur */}
            <div
              data-rotation-zone="top-left"
              style={{
                position: "absolute",
                left: (-handleSize * 2.3) + (handleSize / 2), // Aligné avec le centre de la poignée
                top: (-handleSize * 2.3) + (handleSize / 2),
                width: handleSize * 2.3,
                height: handleSize * 2.3,
                cursor: rotateCursor,
                zIndex: 7, // Sous les poignées mais sous les sous-titres
              }}
              onMouseEnter={() => {
                setHoveredRotationZone(index);
                setHoveredRotationCorner('top-left');
              }}
              onMouseLeave={() => {
                setHoveredRotationZone(null);
                setHoveredRotationCorner(null);
              }}
              onMouseDown={(ev) => startRotating(ev, index)}
            />
            
            {/* Zone de rotation coin supérieur droit */}
            <div
              data-rotation-zone="top-right"
              style={{
                position: "absolute",
                left: elementWidth - (handleSize / 2), // Position basée sur la largeur réelle de l'élément
                top: (-handleSize * 2.3) + (handleSize / 2),
                width: handleSize * 2.3,
                height: handleSize * 2.3,
                cursor: rotateCursor,
                zIndex: 7, // Sous les sous-titres
              }}
              onMouseEnter={() => {
                setHoveredRotationZone(index);
                setHoveredRotationCorner('top-right');
              }}
              onMouseLeave={() => {
                setHoveredRotationZone(null);
                setHoveredRotationCorner(null);
              }}
              onMouseDown={(ev) => startRotating(ev, index)}
            />
            
            {/* Zone de rotation coin inférieur gauche */}
            <div
              data-rotation-zone="bottom-left"
              style={{
                position: "absolute",
                left: (-handleSize * 2.3) + (handleSize / 2),
                top: elementHeight - (handleSize / 2), // Position basée sur la hauteur réelle de l'élément
                width: handleSize * 2.3,
                height: handleSize * 2.3,
                cursor: rotateCursor,
                zIndex: 7, // Sous les sous-titres
              }}
              onMouseEnter={() => {
                setHoveredRotationZone(index);
                setHoveredRotationCorner('bottom-left');
              }}
              onMouseLeave={() => {
                setHoveredRotationZone(null);
                setHoveredRotationCorner(null);
              }}
              onMouseDown={(ev) => startRotating(ev, index)}
            />
            
            {/* Zone de rotation coin inférieur droit */}
            <div
              data-rotation-zone="bottom-right"
              style={{
                position: "absolute",
                left: elementWidth - (handleSize / 2),
                top: elementHeight - (handleSize / 2),
                width: handleSize * 2.3,
                height: handleSize * 2.3,
                cursor: rotateCursor,
                zIndex: 7, // Sous les sous-titres
              }}
              onMouseEnter={() => {
                setHoveredRotationZone(index);
                setHoveredRotationCorner('bottom-right');
              }}
              onMouseLeave={() => {
                setHoveredRotationZone(null);
                setHoveredRotationCorner(null);
              }}
              onMouseDown={(ev) => startRotating(ev, index)}
            />
            
          </>
        )}

      </div>
    );
  };

  return (
    <AbsoluteFill>
      {/* Conteneur avec overflow hidden pour les médias seulement */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {elements.map((element, index) => {
          const startFrame = Math.round(element.start * fps);
          const endFrame = Math.round(element.end * fps);
          const durationInFrames = (endFrame - startFrame) - 1;

          return (
            <Sequence
              key={`media-${index}`}
              from={startFrame}
              durationInFrames={durationInFrames}
              layout="none"
            >
              {/* Média uniquement */}
              {renderElementMedia(element, index)}
            </Sequence>
          );
        })}
      </AbsoluteFill>

      {getRemotionEnvironment().isPlayer && (
        <AbsoluteFill style={{ overflow: 'visible' }}>
          {elements.map((element, index) => {
            const startFrame = Math.round(element.start * fps);
            const endFrame = Math.round(element.end * fps);
            const durationInFrames = (endFrame - startFrame) - 1;

            return (
              <Sequence
                key={`overlay-${index}`}
                from={startFrame}
                durationInFrames={durationInFrames}
                layout="none"
              >
                {/* Overlay de sélection uniquement */}
                {renderElementOverlay(element, index)}
              </Sequence>
            );
          })}
        </AbsoluteFill>
      )}

      {/* Menu flottant rendu au niveau supérieur */}
      {getRemotionEnvironment().isPlayer && showMenu && selectedElementIndex !== null && elements[selectedElementIndex] && (
        <AbsoluteFill style={{ overflow: 'visible', pointerEvents: 'none' }}>
          <div 
            ref={menuRef}
            style={{
              position: "absolute",
              left: `${(elements[selectedElementIndex].position.x / 100) * compositionWidth}px`,
              top: `${(elements[selectedElementIndex].position.y / 100) * compositionHeight - (compositionWidth * (elements[selectedElementIndex].size / 100) * (naturalRatios[selectedElementIndex] || 1)) / 2}px`,
              transform: `translate(-50%, -100%) translateY(-${15 / Math.max(0.0001, scale)}px)`,
              zIndex: 9, // Menu des éléments sous les sous-titres
              pointerEvents: 'auto',
            }}
          >
            <VideoElementMenu
              element={elements[selectedElementIndex]}
              sequences={sequences}
              index={selectedElementIndex}
              scale={scale}
              onElementMediaChange={onElementMediaChange}
              onElementStartChange={onElementStartChange}
              onElementEndChange={onElementEndChange}
              onElementDelete={onElementDelete}
              onMouseDown={(ev) => ev.stopPropagation()}
              onClick={(ev) => ev.stopPropagation()}
              overlappingElements={overlappingElements[selectedElementIndex] || []}
              allElements={elements}
              onElementReorder={onElementReorder}
            />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
