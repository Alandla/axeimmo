import { AbsoluteFill, Img, useCurrentScale, useVideoConfig } from "remotion";
import { LogoPositionSelector } from "../../../components/ui/logo-position-selector";
import { useState, useRef, useCallback, useEffect } from "react";
import { LogoPosition } from "../type/space";

interface SpaceLogoProps {
  logoUrl?: string;
  logoPosition?: LogoPosition;
  onPositionChange?: (position: LogoPosition) => void;
  logoSize?: number; // Taille en pourcentage de la largeur de composition
  onSizeChange?: (size: number) => void;
}

const MIN_SIZE = 5; // Taille minimale en pourcentage
const MAX_SIZE = 50; // Taille maximale en pourcentage

export const SpaceLogo = ({
  logoUrl,
  logoPosition,
  onPositionChange,
  logoSize = 19,
  onSizeChange,
}: SpaceLogoProps) => {
  const { width: compositionWidth, height: compositionHeight } = useVideoConfig();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showResizeHandle, setShowResizeHandle] = useState(false);
  const [logoPercent, setLogoPercent] = useState<LogoPosition | null>(null);
  const [currentSize, setCurrentSize] = useState(logoSize);
  const logoRef = useRef<HTMLImageElement>(null);
  const playerElementRef = useRef<HTMLElement | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [mouseDownTime, setMouseDownTime] = useState(0);
  const scale = useCurrentScale();
  const [naturalRatio, setNaturalRatio] = useState<number>(0.5);
  const [showSelector, setShowSelector] = useState(false);
  const selectorWasOpenRef = useRef(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentSize(logoSize);
  }, [logoSize]);

  const findPlayerElement = useCallback(() => {
    if (playerElementRef.current) {
      return playerElementRef.current;
    }
    let el = logoRef.current;
    let parent: HTMLElement | null = el?.parentElement || null;
    while (parent && !parent.classList.contains("__remotion-player")) {
      parent = parent.parentElement;
    }
    playerElementRef.current = parent;
    return parent;
  }, []);

  const getInitialLogoPercent = useCallback((): LogoPosition => {
    // Utiliser les coordonnées directement si elles existent
    if (logoPosition) {
      return logoPosition;
    }

    // Position par défaut (bottom-right)
    return { x: 85, y: 85 };
  }, [logoPosition]);

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si on a bougé ou si on est en train de drag, ne pas ouvrir le sélecteur
    if (hasMoved || isDragging) return;
    
    // Vérifier que c'est un clic rapide (pas un drag)
    const clickDuration = Date.now() - mouseDownTime;
    if (clickDuration > 200) return; // Plus de 200ms = probablement un drag
    
    // Afficher la poignée de redimensionnement et le sélecteur flottant
    setShowResizeHandle(true);
    setShowSelector(true);
  }, [hasMoved, isDragging, mouseDownTime]);

  // Fermer la poignée de resize / le sélecteur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (showResizeHandle || showSelector) &&
        logoRef.current &&
        !logoRef.current.contains(event.target as Node) &&
        (!selectorRef.current || !selectorRef.current.contains(event.target as Node))
      ) {
        setShowResizeHandle(false);
        setShowSelector(false);
      }
    };

    if (showResizeHandle || showSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResizeHandle, showSelector]);

  const startDragging = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Enregistrer le temps de début du mouseDown
      setMouseDownTime(Date.now());
      setHasMoved(false);
      
      const playerElement = findPlayerElement();
      if (!playerElement) return;
      const playerRect = playerElement.getBoundingClientRect();
      const logoRect = logoRef.current?.getBoundingClientRect();
      if (!logoRect) return;

      // Calculer l'offset par rapport au centre du logo
      const logoCenterX = logoRect.left + logoRect.width / 2;
      const logoCenterY = logoRect.top + logoRect.height / 2;
      const offsetX = e.clientX - logoCenterX;
      const offsetY = e.clientY - logoCenterY;

      let animationFrameId: number;
      let lastUpdateTime = 0;
      const THROTTLE_MS = 16; // ~60fps

      const onMouseMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();

        // Marquer qu'on a bougé
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
          const logoRectMove = logoRef.current?.getBoundingClientRect();
          if (!logoRectMove) return;

          // Calculer la nouvelle position du centre du logo
          let newCenterX = moveEvent.clientX - playerRectMove.left - offsetX;
          let newCenterY = moveEvent.clientY - playerRectMove.top - offsetY;
          const scaleX = compositionWidth / playerRectMove.width;
          const scaleY = compositionHeight / playerRectMove.height;
          let compositionX = newCenterX * scaleX;
          let compositionY = newCenterY * scaleY;
          const logoWidth = compositionWidth * (currentSize / 100);
          const logoHeight = logoWidth * naturalRatio;

          // Calculer les limites en tenant compte de la taille actuelle du logo
          const minX = logoWidth / 2;
          const maxX = compositionWidth - logoWidth / 2;
          const minY = logoHeight / 2;
          const maxY = compositionHeight - logoHeight / 2;

          compositionX = Math.max(minX, Math.min(compositionX, maxX));
          compositionY = Math.max(minY, Math.min(compositionY, maxY));

          const rawPosition = {
            x: (compositionX / compositionWidth) * 100,
            y: (compositionY / compositionHeight) * 100,
          };

          setLogoPercent(rawPosition);

          // Propager le changement de position
          if (onPositionChange) {
            onPositionChange(rawPosition);
          }
        });
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        upEvent.stopPropagation();
        setIsDragging(false);
        // Fermer la poignée de resize après le drag
        setShowResizeHandle(false);
        // Afficher le sélecteur après le déplacement si on a bougé
        if (hasMoved) {
          setShowSelector(true);
        } else if (selectorWasOpenRef.current) {
          // Réafficher le sélecteur si il était ouvert avant et qu'on n'a pas bougé
          setShowSelector(true);
        }
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        window.removeEventListener("pointermove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      // Cacher le sélecteur pendant le déplacement, puis le restaurer à la fin
      selectorWasOpenRef.current = showSelector;
      setShowSelector(false);
      setIsDragging(true);
      window.addEventListener("pointermove", onMouseMove, { passive: false });
      window.addEventListener("mouseup", onMouseUp, { passive: false });
    },
    [
      findPlayerElement,
      compositionWidth,
      compositionHeight,
      onPositionChange,
      currentSize,
    ]
  );

  type HandleType = "top-left" | "top-right" | "bottom-left" | "bottom-right";

  const startResizing = useCallback(
    (e: React.MouseEvent, handle: HandleType) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Enregistrer le temps de début du mouseDown pour éviter le clic
      setMouseDownTime(Date.now());
      setHasMoved(false);
      
      const playerElement = findPlayerElement();
      if (!playerElement) return;
      const playerRect = playerElement.getBoundingClientRect();
      const logoRect = logoRef.current?.getBoundingClientRect();
      if (!logoRect) return;
      const initialSize = currentSize;

      // Centre du logo en coordonnées composition
      const currentPercent = logoPercent ?? getInitialLogoPercent();
      const centerXComp = (currentPercent.x / 100) * compositionWidth;
      const centerYComp = (currentPercent.y / 100) * compositionHeight;

      // Distance initiale centre -> pointeur en coordonnées composition
      const toCompX = (e.clientX - playerRect.left) * (compositionWidth / playerRect.width);
      const toCompY = (e.clientY - playerRect.top) * (compositionHeight / playerRect.height);
      const initialDistance = Math.max(1, Math.hypot(toCompX - centerXComp, toCompY - centerYComp));

      let animationFrameId: number;
      let lastUpdateTime = 0;
      const THROTTLE_MS = 16; // ~60fps

      const onMouseMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();

        // Marquer qu'on a bougé
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

          // Distance actuelle du pointeur au centre, quelle que soit la poignée
          const currentDistance = Math.max(1, Math.hypot(pointerXComp - centerXComp, pointerYComp - centerYComp));
          const scaleFactor = currentDistance / initialDistance;

          let newSize = initialSize * scaleFactor;

          // Limiter la taille entre MIN_SIZE et MAX_SIZE
          newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newSize));

          // Vérifier que la position reste dans les limites avec la nouvelle taille
          const newLogoWidth = compositionWidth * (newSize / 100);
          const newLogoHeight = newLogoWidth * naturalRatio;
          const currentX = centerXComp;
          const currentY = centerYComp;

          // Ajuster la position si nécessaire pour rester dans le cadre
          const minX = newLogoWidth / 2;
          const maxX = compositionWidth - newLogoWidth / 2;
          const minY = newLogoHeight / 2;
          const maxY = compositionHeight - newLogoHeight / 2;

          const adjustedX = Math.max(minX, Math.min(currentX, maxX));
          const adjustedY = Math.max(minY, Math.min(currentY, maxY));

          const adjustedPosition = {
            x: (adjustedX / compositionWidth) * 100,
            y: (adjustedY / compositionHeight) * 100,
          };

          setCurrentSize(newSize);
          setLogoPercent(adjustedPosition);

          if (onSizeChange) {
            onSizeChange(newSize);
          }
          if (onPositionChange) {
            onPositionChange(adjustedPosition);
          }
        });
      };

      const onMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        upEvent.stopPropagation();
        setIsResizing(false);
        // Afficher le sélecteur après le redimensionnement si on a bougé
        if (hasMoved) {
          setShowSelector(true);
        } else if (selectorWasOpenRef.current) {
          // Réafficher le sélecteur si il était ouvert avant et qu'on n'a pas bougé
          setShowSelector(true);
        }
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        window.removeEventListener("pointermove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      // Cacher le sélecteur pendant le resize
      selectorWasOpenRef.current = showSelector;
      setShowSelector(false);
      setIsResizing(true);
      window.addEventListener("pointermove", onMouseMove, { passive: false });
      window.addEventListener("mouseup", onMouseUp, { passive: false });
    },
    [
      findPlayerElement,
      compositionWidth,
      compositionHeight,
      currentSize,
      onSizeChange,
      onPositionChange,
      logoPercent,
      getInitialLogoPercent,
    ]
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  // Ne pas afficher le logo si showLogo est false ou si pas d'URL
  if (!logoUrl) {
    return null;
  }

  const percent = logoPercent ?? getInitialLogoPercent();
  const size = currentSize;
  const logoWidth = compositionWidth * (size / 100);
  const logoHeight = logoWidth * naturalRatio;
  const outlineBorder = Math.ceil(2 / Math.max(0.0001, scale));

  const imgStyle: React.CSSProperties = {
    position: "absolute",
    width: `${size}%`,
    height: "auto",
    opacity: 1,
    zIndex: 1000,
    left: `${(percent.x / 100) * compositionWidth - logoWidth / 2}px`,
    top: `${(percent.y / 100) * compositionHeight - logoHeight / 2}px`,
    pointerEvents: "none",
  };

  const outlineStyle: React.CSSProperties = {
    position: "absolute",
    left: `${(percent.x / 100) * compositionWidth - logoWidth / 2}px`,
    top: `${(percent.y / 100) * compositionHeight - logoHeight / 2}px`,
    width: `${logoWidth}px`,
    height: `${logoHeight}px`,
    outline:
      (isHovered && !isResizing) || showResizeHandle
        ? `${outlineBorder}px solid #0B84F3`
        : undefined,
    userSelect: "none",
    touchAction: "none",
    cursor: isDragging ? "grabbing" : isHovered ? "grab" : "pointer",
    zIndex: 1001,
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
    <AbsoluteFill>
      <Img
        ref={logoRef}
        src={logoUrl}
        style={imgStyle}
        onLoad={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (img && img.naturalWidth) {
            setNaturalRatio(img.naturalHeight / img.naturalWidth);
          }
        }}
      />

      {/* Overlay de sélection + handles */}
      <div
        style={outlineStyle}
        onMouseDown={startDragging}
        onClick={handleLogoClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {((isHovered && !isResizing) || showResizeHandle) && (
          <>
            {/* Top-Left */}
            <div
              style={{
                ...sharedHandleStyle,
                left: 0,
                top: 0,
                transform: "translate(-50%, -50%)",
                cursor: "nwse-resize",
              }}
              onMouseDown={(ev) => startResizing(ev, "top-left")}
            />
            {/* Top-Right */}
            <div
              style={{
                ...sharedHandleStyle,
                left: "100%",
                top: 0,
                transform: "translate(-50%, -50%)",
                cursor: "nesw-resize",
              }}
              onMouseDown={(ev) => startResizing(ev, "top-right")}
            />
            {/* Bottom-Left */}
            <div
              style={{
                ...sharedHandleStyle,
                left: 0,
                top: "100%",
                transform: "translate(-50%, -50%)",
                cursor: "nesw-resize",
              }}
              onMouseDown={(ev) => startResizing(ev, "bottom-left")}
            />
            {/* Bottom-Right */}
            <div
              style={{
                ...sharedHandleStyle,
                left: "100%",
                top: "100%",
                transform: "translate(-50%, -50%)",
                cursor: "nwse-resize",
              }}
              onMouseDown={(ev) => startResizing(ev, "bottom-right")}
            />
          </>
        )}

        {showSelector && (
          <div
            ref={selectorRef}
            onMouseDown={(ev) => ev.stopPropagation()}
            onClick={(ev) => ev.stopPropagation()}
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              // Place the anchor above the logo by a visual 8px regardless of player scale
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
              <LogoPositionSelector
                value={{ x: percent.x, y: percent.y }}
                onChange={(pos) => {
                  setLogoPercent(pos);
                  if (onPositionChange) onPositionChange(pos);
                }}
                isSquare={true}
                predefinedOnly={true}
                hideBottomPositions={true}
                hideLabel={true}
              />
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
