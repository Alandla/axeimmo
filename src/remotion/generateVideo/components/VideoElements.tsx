import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, useCurrentScale, OffthreadVideo, Sequence, getRemotionEnvironment } from "remotion";
import { useState, useRef, useCallback, useEffect } from "react";
import { IElement, ISequence } from "../type/video";
import { VideoElementMenu } from "../../../components/ui/video-element-menu";

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
const MAX_SIZE = 100; // Taille maximale en pourcentage

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
  const { width: compositionWidth, height: compositionHeight, fps } = useVideoConfig();
  const frame = useCurrentFrame();
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
      zIndex: 100 + index,
      objectFit: "cover",
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
        {getRemotionEnvironment().isPlayer && showMenu && isSelected && (
          <div ref={menuRef}>
            <VideoElementMenu
              element={element}
              sequences={sequences}
              index={index}
              scale={scale}
              onElementMediaChange={onElementMediaChange}
              onElementStartChange={onElementStartChange}
              onElementEndChange={onElementEndChange}
              onElementDelete={onElementDelete}
              onMouseDown={(ev) => ev.stopPropagation()}
              onClick={(ev) => ev.stopPropagation()}
            />
          </div>
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
    </AbsoluteFill>
  );
};
