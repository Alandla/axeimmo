import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";
import { useEffect, useState, useCallback, useRef } from "react";
import googleFonts from "../../config/googleFonts.config";
import { VideoFormat, calculateSubtitlePosition } from "../../utils/videoDimensions";

export const SubtitleBold = ({ subtitleSequence, start, style, videoFormat, onPositionChange }: { 
    subtitleSequence: any, 
    start: number, 
    style: any, 
    videoFormat?: VideoFormat,
    onPositionChange?: (position: number) => void 
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const subtitleRef = useRef<HTMLDivElement>(null);
    const playerElementRef = useRef<HTMLElement | null>(null);

    // Fonction pour trouver le player Remotion dans le DOM
    const findPlayerElement = useCallback(() => {
        if (playerElementRef.current) {
            return playerElementRef.current;
        }
        
        let el = subtitleRef.current;
        let parent: HTMLElement | null = el?.parentElement || null;
        
        while (parent && !parent.classList.contains('__remotion-player')) {
            parent = parent.parentElement;
        }
        
        playerElementRef.current = parent;
        return parent;
    }, []);

    // Fonction pour démarrer le glissement
    const startDragging = useCallback((e: React.MouseEvent) => {
        if (!onPositionChange) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const playerElement = findPlayerElement();
        let playerRect = playerElement ? playerElement.getBoundingClientRect() : null;
        
        setIsDragging(true);
        
        const initialY = e.clientY;
        const initialPosition = style.position;
        
        const onMouseMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            
            if (playerElement && playerRect) {
                playerRect = playerElement.getBoundingClientRect();
                
                const relativeY = moveEvent.clientY - playerRect.top;
                
                const percentageY = (relativeY / playerRect.height) * 100;
                
                const newPosition = Math.round(Math.max(0, Math.min(100, percentageY)));
                
                onPositionChange(newPosition);
            } else {
                const deltaY = (moveEvent.clientY - initialY) / 4;
                const newPosition = Math.max(0, Math.min(100, initialPosition + deltaY));
                onPositionChange(newPosition);
            }
        };
        
        const onMouseUp = (upEvent: MouseEvent) => {
            upEvent.preventDefault();
            upEvent.stopPropagation();
            
            setIsDragging(false);
            window.removeEventListener('pointermove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        
        window.addEventListener('pointermove', onMouseMove, { passive: false });
        window.addEventListener('mouseup', onMouseUp, { passive: false });
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovered(false);
    }, []);

    useEffect(() => {
        const loadFontByName = async (fontSelected: string, weights?: string[], isItalic?: boolean) => {
            const font = googleFonts.find((font) => font.family === fontSelected);
            if (font) {
                await font.load(weights, isItalic);
            }
        };

        // Initialize weight arrays directly with values
        const mainWeights: string[] = [(style?.fontWeight || 700).toString()];
        const activeWordWeights: string[] = [(style?.activeWord?.fontWeight || 700).toString()];

        // Load main font
        loadFontByName(
            style?.fontFamily || 'Montserrat', 
            mainWeights,
            style?.isItalic || false
        );

        // Load active word font if different
        if (style?.activeWord?.isActive && style?.activeWord?.fontFamily !== style?.fontFamily) {
            loadFontByName(
                style?.activeWord.fontFamily || 'Montserrat',
                activeWordWeights,
                style?.activeWord?.isItalic || false
            );
        }
    }, [style?.fontFamily, style?.fontWeight, style?.isItalic, style?.activeWord?.fontFamily, style?.activeWord?.fontWeight, style?.activeWord?.isItalic, style?.activeWord?.isActive]);

    const getAnimationValues = () => {
        let scale = 1;
        let opacity = 1;
        let blurValue = 0;

        switch (style.animation?.appear) {
            case 'zoom':
                scale = spring({
                    fps,
                    frame,
                    from: 0.86,
                    to: 1,
                    config: {
                        mass: 0.5,
                        stiffness: 2,
                    },
                    durationInFrames: 6,
                });
                break;
            case 'bounce':
                scale = spring({
                    fps,
                    frame,
                    from: 0.7,
                    to: 1,
                    config: {
                        stiffness: 100,
                        damping: 10,
                    },
                    durationInFrames: 30,
                });
                break;
            case 'fade':
                opacity = spring({
                    fps,
                    frame,
                    from: 0,
                    to: 1,
                    config: {
                        mass: 1,
                        stiffness: 50,
                        damping: 20,
                    },
                    durationInFrames: 20,
                });
                break;
            case 'blur':
                const blurAnimation = spring({
                    fps,
                    frame,
                    config: {
                      damping: 200,
                      stiffness: 100,
                      overshootClamping: true,
                    },
                  });
                
                  // Valeur du flou : réduit de 20px à 0px en 0.3 secondes
                blurValue = interpolate(
                    blurAnimation,
                    [0, 0.5],
                    [10, 0], // De 20px de flou à 0px
                    {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }
                );
        }
        return { scale, opacity, blurValue };
    };

    const { scale, opacity, blurValue } = getAnimationValues();

    const shadowColor = style.shadow.color ? style.shadow.color : 'black';

    // Utiliser la fonction calculateSubtitlePosition pour obtenir la position en fonction du format
    const verticalPosition = calculateSubtitlePosition(style.position || 50, videoFormat || 'vertical');

    const shadowSizes = [
        'none',
        `${shadowColor} 0px 0px 8px, ${shadowColor} 0px 0px 9px, ${shadowColor} 0px 0px 10px, ${shadowColor} 0px 0px 11px, ${shadowColor} 0px 0px 12px`,
        `${shadowColor} 0px 0px 8px, ${shadowColor} 0px 0px 10px, ${shadowColor} 0px 0px 12px, ${shadowColor} 0px 0px 14px, ${shadowColor} 0px 0px 16px, ${shadowColor} 0px 0px 18px`,
        `${shadowColor} 0px 0px 8px, ${shadowColor} 0px 0px 11px, ${shadowColor} 0px 0px 14px, ${shadowColor} 0px 0px 17px, ${shadowColor} 0px 0px 20px, ${shadowColor} 0px 0px 23px, ${shadowColor} 0px 0px 26px, ${shadowColor} 0px 0px 29px, ${shadowColor} 0px 0px 32px`,
        `${shadowColor} 0px 0px 8px, ${shadowColor} 0px 0px 12px, ${shadowColor} 0px 0px 16px, ${shadowColor} 0px 0px 20px, ${shadowColor} 0px 0px 24px, ${shadowColor} 0px 0px 28px, ${shadowColor} 0px 0px 32px, ${shadowColor} 0px 0px 36px, ${shadowColor} 0px 0px 40px, ${shadowColor} 0px 0px 44px`,
        `${shadowColor} 0px 0px 8px, ${shadowColor} 0px 0px 13px, ${shadowColor} 0px 0px 18px, ${shadowColor} 0px 0px 23px, ${shadowColor} 0px 0px 28px, ${shadowColor} 0px 0px 33px, ${shadowColor} 0px 0px 38px, ${shadowColor} 0px 0px 43px, ${shadowColor} 0px 0px 48px, ${shadowColor} 0px 0px 53px`,
    ];

    return (
        <AbsoluteFill
            style={{
                marginTop: `${verticalPosition}px`,
            }}
            ref={subtitleRef}
        >
            <div 
                style={{
                    transform: `scale(${scale})`,
                    opacity: opacity,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10,
                    cursor: onPositionChange ? (isDragging ? 'grabbing' : (isHovered ? 'grab' : 'default')) : 'default',
                    userSelect: 'none',
                    touchAction: 'none',
                }}
                onMouseDown={startDragging}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {subtitleSequence.lines.map((line: Line, lineIndex: number) => (
                    <div key={lineIndex}>
                        {line.words.map((word: Word, index: number) => {
                            const isWordActive = (frame+start) >= word.startInFrames && (frame+start) < (word.startInFrames + word.durationInFrames);

                            const wordStyle = isWordActive && style.activeWord.isActive
                                ? {
                                    color: style.activeWord.color,
                                    fontSize: `${style.activeWord.fontSize}px`,
                                    fontStyle: style.activeWord.isItalic ? 'italic' : 'normal',
                                    textTransform: style.activeWord.isUppercase ? 'uppercase' as const : 'none' as const,
                                    fontFamily: `${style.activeWord.fontFamily || 'Montserrat'}, sans-serif`,
                                    fontWeight: style.activeWord.fontWeight || 700,
                                  }
                                : {
                                    color: style.color,
                                    fontSize: `${style.fontSize}px`,
                                    fontStyle: style.isItalic ? 'italic' : 'normal',
                                    textTransform: style.isUppercase ? 'uppercase' as const : 'none' as const,
                                    fontFamily: `${style.fontFamily || 'Montserrat'}, sans-serif`,
                                    fontWeight: style.fontWeight || 700,
                                  };

                            return (
                                <span 
                                    key={index} 
                                    className="word"
                                    style={{
                                        ...wordStyle,
                                        textAlign: 'center',
                                        lineHeight: '1.2',
                                        textShadow: style.shadow.isActive ? shadowSizes[style.shadow.size] : 'none',
                                        filter: blurValue > 0 ? `blur(${blurValue}px)` : 'none',
                                    }}>
                                        {word.word}{' '}
                                </span>
                            )
                        })}
                    </div>
                ))}
            </div>
        </AbsoluteFill>
    );
}