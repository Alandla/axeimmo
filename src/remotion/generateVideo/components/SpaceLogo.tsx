import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { AbsoluteFill, Img, useVideoConfig } from "remotion";
import { useState, useRef, useCallback } from "react";

export const SpaceLogo = () => {
  const { activeSpace } = useActiveSpaceStore();
  const { width: compositionWidth, height: compositionHeight } =
    useVideoConfig();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [logoPercent, setLogoPercent] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const playerElementRef = useRef<HTMLElement | null>(null);

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

  const getInitialLogoPercent = useCallback(() => {
    let px = 20,
      py = 40;
    const logoWidth = compositionWidth * 0.19;
    const logoHeight = logoWidth * 0.5;

    switch (activeSpace?.logoPosition) {
      case "top-left":
        px = 20;
        py = 40;
        break;
      case "top-right":
        px = compositionWidth - logoWidth - 20;
        py = 40;
        break;
      case "middle-left":
        px = 20;
        py = (compositionHeight - logoHeight) / 2;
        break;
      case "middle-right":
        px = compositionWidth - logoWidth - 20;
        py = (compositionHeight - logoHeight) / 2;
        break;
      case "bottom-left":
        px = 20;
        py = compositionHeight - logoHeight - 40;
        break;
      case "bottom-right":
        px = compositionWidth - logoWidth - 20;
        py = compositionHeight - logoHeight - 40;
        break;
      default:
        px = 20;
        py = 40;
    }
    return {
      x: (px / compositionWidth) * 100,
      y: (py / compositionHeight) * 100,
    };
  }, [activeSpace, compositionWidth, compositionHeight]);

  const startDragging = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const playerElement = findPlayerElement();
      if (!playerElement) return;
      const playerRect = playerElement.getBoundingClientRect();
      const logoRect = logoRef.current?.getBoundingClientRect();
      if (!logoRect) return;
      const offsetX = e.clientX - logoRect.left;
      const offsetY = e.clientY - logoRect.top;
      const onMouseMove = (moveEvent: PointerEvent) => {
        moveEvent.preventDefault();
        const playerRectMove = playerElement.getBoundingClientRect();
        const logoRectMove = logoRef.current?.getBoundingClientRect();
        if (!logoRectMove) return;
        let newX = moveEvent.clientX - playerRectMove.left - offsetX;
        let newY = moveEvent.clientY - playerRectMove.top - offsetY;
        const scaleX = compositionWidth / playerRectMove.width;
        const scaleY = compositionHeight / playerRectMove.height;
        let compositionX = newX * scaleX;
        let compositionY = newY * scaleY;
        const logoWidth = compositionWidth * 0.19;
        const logoHeight = logoWidth * 0.5;
        const maxX = compositionWidth - logoWidth;
        const maxY = compositionHeight - logoHeight;
        compositionX = Math.max(0, Math.min(compositionX, maxX));
        compositionY = Math.max(0, Math.min(compositionY, maxY));
        setLogoPercent({
          x: (compositionX / compositionWidth) * 100,
          y: (compositionY / compositionHeight) * 100,
        });
      };
      const onMouseUp = (upEvent: MouseEvent) => {
        upEvent.preventDefault();
        upEvent.stopPropagation();
        setIsDragging(false);
        window.removeEventListener("pointermove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      setIsDragging(true);
      window.addEventListener("pointermove", onMouseMove, { passive: false });
      window.addEventListener("mouseup", onMouseUp, { passive: false });
    },
    [findPlayerElement, compositionWidth, compositionHeight]
  );

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  if (!activeSpace?.logoUrl || !activeSpace?.showLogo) return null;

  const percent = logoPercent ?? getInitialLogoPercent();
  const style: React.CSSProperties = {
    position: "absolute",
    width: "19%",
    height: "auto",
    opacity: 0.85,
    zIndex: 1000,
    left: `${(percent.x / 100) * compositionWidth}px`,
    top: `${(percent.y / 100) * compositionHeight}px`,
    cursor: isDragging ? "grabbing" : isHovered ? "grab" : "default",
    userSelect: "none",
    touchAction: "none",
  };

  return (
    <AbsoluteFill>
      <Img
        ref={logoRef}
        src={activeSpace.logoUrl}
        style={style}
        onMouseDown={startDragging}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </AbsoluteFill>
  );
};