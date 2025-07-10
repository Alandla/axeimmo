import { AbsoluteFill, Img, useVideoConfig } from "remotion";
import { useState, useRef, useCallback, useEffect } from "react";
import { LogoPosition } from "@/src/types/space";

interface SpaceLogoProps {
  logoUrl?: string;
  logoPosition?: LogoPosition;
  showLogo?: boolean;
  onPositionChange?: (position: LogoPosition) => void;
  logoSize?: number; // Taille en pourcentage de la largeur de composition
  onSizeChange?: (size: number) => void;
  onLogoClick?: () => void; // Nouveau callback pour ouvrir le sélecteur
}

const MIN_SIZE = 5; // Taille minimale en pourcentage
const MAX_SIZE = 50; // Taille maximale en pourcentage

export const SpaceLogo = ({
  logoUrl,
  logoPosition,
  showLogo,
  onPositionChange,
  logoSize = 19,
  onSizeChange,
  onLogoClick,
}: SpaceLogoProps) => {
  const { width: compositionWidth, height: compositionHeight } =
    useVideoConfig();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showResizeHandle, setShowResizeHandle] = useState(false);
  const [logoPercent, setLogoPercent] = useState<LogoPosition | null>(null);
  const [currentDragPosition, setCurrentDragPosition] =
    useState<LogoPosition | null>(null);
  const [currentSize, setCurrentSize] = useState(logoSize);
  const logoRef = useRef<HTMLImageElement>(null);
  const playerElementRef = useRef<HTMLElement | null>(null);
  const [hasMoved, setHasMoved] = useState(false);
  const [mouseDownTime, setMouseDownTime] = useState(0);

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
    
    // Afficher la poignée de redimensionnement
    setShowResizeHandle(true);
    
    // Ouvrir le sélecteur de position
    if (onLogoClick) {
      onLogoClick();
    }
  }, [hasMoved, isDragging, mouseDownTime, onLogoClick]);

  // Fermer la poignée de resize quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showResizeHandle &&
        logoRef.current &&
        !logoRef.current.contains(event.target as Node)
      ) {
        setShowResizeHandle(false);
      }
    };

    if (showResizeHandle) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showResizeHandle]);

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
          const logoHeight = logoWidth * 0.5;

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

          setCurrentDragPosition(rawPosition);
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
        setCurrentDragPosition(null);
        // Fermer la poignée de resize après le drag
        setShowResizeHandle(false);
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        window.removeEventListener("pointermove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

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

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
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
      const initialX = e.clientX;

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
          const deltaX = moveEvent.clientX - initialX;
          const scaleX = compositionWidth / playerRect.width;
          const deltaSize = ((deltaX * scaleX) / compositionWidth) * 100;
          let newSize = initialSize - deltaSize;

          // Limiter la taille entre MIN_SIZE et MAX_SIZE
          newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, newSize));

          // Vérifier que la position reste dans les limites avec la nouvelle taille
          const newLogoWidth = compositionWidth * (newSize / 100);
          const newLogoHeight = newLogoWidth * 0.5;
          const currentPercent = logoPercent ?? getInitialLogoPercent();
          const currentX = (currentPercent.x / 100) * compositionWidth;
          const currentY = (currentPercent.y / 100) * compositionHeight;

          // Ajuster la position si nécessaire
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

          // Propager les changements
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
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        window.removeEventListener("pointermove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

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
  if (!showLogo || !logoUrl) {
    return null;
  }

  const percent = logoPercent ?? getInitialLogoPercent();
  const size = currentSize;
  const logoWidth = compositionWidth * (size / 100);
  const logoHeight = logoWidth * 0.5;

  const style: React.CSSProperties = {
    position: "absolute",
    width: `${size}%`,
    height: "auto",
    opacity: 1,
    zIndex: 1000,
    left: `${(percent.x / 100) * compositionWidth - logoWidth / 2}px`,
    top: `${(percent.y / 100) * compositionHeight - logoHeight / 2}px`,
    cursor: isDragging ? "grabbing" : isHovered ? "grab" : "pointer",
    userSelect: "none",
    touchAction: "none",
    border: isHovered || showResizeHandle ? "4px solid #3b82f6" : "none",
    borderRadius: "4px",
    transition: "border 0.2s ease",
  };

  return (
    <AbsoluteFill>
      <Img
        ref={logoRef}
        src={logoUrl}
        style={style}
        onMouseDown={startDragging}
        onClick={handleLogoClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* Poignée de redimensionnement */}
      {showResizeHandle && (
        <div
          style={{
            position: "absolute",
            width: 32,
            height: 32,
            left: `${
              (percent.x / 100) * compositionWidth - logoWidth / 2 - 16
            }px`,
            top: `${
              (percent.y / 100) * compositionHeight - logoHeight / 2 - 16
            }px`,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            borderRadius: "50%",
            border: "3px solid white",
            cursor: "nw-resize",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
          }}
          onMouseDown={startResizing}
        >
          <div
            style={{
              width: 12,
              height: 12,
              backgroundColor: "white",
              borderRadius: "2px",
              transform: "rotate(45deg)",
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
