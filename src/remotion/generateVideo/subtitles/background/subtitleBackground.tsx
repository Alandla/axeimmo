import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";
import { useEffect, useState, useCallback, useRef } from "react";
import googleFonts from "../../config/googleFonts.config";
import { VideoFormat, calculateSubtitlePosition } from "../../utils/videoDimensions";

export const SubtitleBackground = ({ subtitleSequence, start, style, videoFormat, onPositionChange }: { 
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
        const loadFontByName = async (fontSelected: string) => {
            const font = googleFonts.find((font) => font.family === fontSelected);
            if (font) {
                await font.load();
            }
        };

        loadFontByName(style?.fontFamily || 'Montserrat');
        if (style?.activeWord?.isActive && style?.activeWord?.fontFamily !== style?.fontFamily) {
            loadFontByName(style?.activeWord.fontFamily || 'Montserrat');
        }
    }, [style?.fontFamily]);

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

    const verticalPosition = calculateSubtitlePosition(style.position || 50, videoFormat || 'vertical');

    const getStroke3D = (isWordActive: boolean) => {
        let threeDEffect = '';
        for (let i = 1; i <= style.border.size; i++) {
            const diagonalDistance = Math.floor(i * 2);
            const shadowDepth = Math.floor(i * 3);
            threeDEffect += `${style.border.color} ${diagonalDistance}px ${shadowDepth}px 3px${i !== style.border.size ? ', ' : ''}`;
        }

        return threeDEffect || 'none';
    };

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
                    position: 'relative',
                    width: 'fit-content',
                    margin: '0 auto',
                    zIndex: 10,
                    cursor: onPositionChange ? (isDragging ? 'grabbing' : (isHovered ? 'grab' : 'default')) : 'default',
                    userSelect: 'none',
                    touchAction: 'none',
                }}
                onMouseDown={startDragging}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {style.background.isActive && style.background.mode === 'full' && (
                    <div style={{
                        position: 'absolute',
                        zIndex: 3,
                        top: '-10px',
                        bottom: '-10px',
                        left: `-10px`,
                        right: `-10px`,
                        backgroundColor: style.background.color || 'red',
                        borderRadius: style.background.radius,
                        filter: blurValue > 0 ? `blur(${blurValue}px)` : 'none',
                    }}></div>
                )}
                
                {subtitleSequence.lines.map((line: Line, lineIndex: number) => {
                    let isLineActive = false;
                    if (line.words.length > 0) {
                        isLineActive = (frame+start) >= line.words[0].startInFrames && 
                            (frame+start) < (line.words[line.words.length - 1].startInFrames + 
                            line.words[line.words.length - 1].durationInFrames);
                    }

                    return (
                        <div key={lineIndex} style={{ position: 'relative' }}>
                            {style.background.isActive && 
                             style.background.mode === 'line' && 
                             isLineActive && (
                                <div style={{
                                    position: 'absolute',
                                    zIndex: 3,
                                    top: '-10px',
                                    bottom: '-10px',
                                    left: `-10px`,
                                    right: `-10px`,
                                    backgroundColor: style.background.color || 'red',
                                    borderRadius: style.background.radius,
                                }}></div>
                            )}
                            
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
                                    <div key={index} style={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        paddingLeft: '0.5rem',
                                        paddingRight: '0.5rem',
                                    }}>
                                        {style.background.isActive && 
                                         style.background.mode === 'word' && 
                                         isWordActive && (
                                            <div style={{
                                                position: 'absolute',
                                                zIndex: 3,
                                                top: '-10px',
                                                bottom: '-10px',
                                                left: `-10px`,
                                                right: `-10px`,
                                                backgroundColor: style.background.color || 'red',
                                                borderRadius: style.background.radius,
                                                filter: blurValue > 0 ? `blur(${blurValue}px)` : 'none',
                                            }}></div>
                                        )}
                                        <span 
                                            className="word"
                                            style={{
                                                ...wordStyle,
                                                position: 'relative',
                                                zIndex: 5,
                                                textAlign: 'center',
                                                lineHeight: '1.2',
                                                filter: blurValue > 0 ? `blur(${blurValue}px)` : 'none',
                                                textShadow: style.border.isActive ? getStroke3D(isWordActive) : 'none',
                                            }}>
                                                {word.word}{' '}
                                        </span>
                                    </div>
                                )
                                })}
                            </div>
                        )
                    })}
                </div>
        </AbsoluteFill>
    );
}