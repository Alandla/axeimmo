import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";
import { useEffect, useState, useCallback, useRef } from "react";
import googleFonts from "../../config/googleFonts.config";
import { VideoFormat, calculateSubtitlePosition } from "../../utils/videoDimensions";

export const SubtitleDaniel = ({ subtitleSequence, start, style, videoFormat, onPositionChange, onPlayPause }: { 
    subtitleSequence: any, 
    start: number, 
    style: any, 
    videoFormat?: VideoFormat,
    onPositionChange?: (position: number) => void,
    onPlayPause?: () => void 
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mouseDownTime, setMouseDownTime] = useState(0);
    const [hasMoved, setHasMoved] = useState(false);
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

    const handleSubtitleClick = (e: React.MouseEvent) => {
        if (hasMoved || isDragging) return;
        
        const clickDuration = Date.now() - mouseDownTime;
        if (clickDuration > 200) return; // Plus de 200ms = probablement un drag
        
        if (onPlayPause) {
            onPlayPause();
        }
    };

    // Fonction pour démarrer le glissement
    const startDragging = useCallback((e: React.MouseEvent) => {
        if (!onPositionChange) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        setMouseDownTime(Date.now());
        setHasMoved(false);
        
        const playerElement = findPlayerElement();
        let playerRect = playerElement ? playerElement.getBoundingClientRect() : null;
        
        setIsDragging(true);
        
        const initialY = e.clientY;
        const initialPosition = style.position;
        
        const onMouseMove = (moveEvent: PointerEvent) => {
            moveEvent.preventDefault();
            
            setHasMoved(true);
            
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

    // Zoom animation with consistent speed
    const scale = spring({
        frame,
        fps,
        from: 0.8,
        to: 1.1,
        config: {
            damping: 200,
            stiffness: 50,
        },
        durationInFrames: 150, // Adjust for desired speed
    });

    const shadowColor = style.shadow.color ? style.shadow.color : 'black';

    // Utiliser la fonction calculateSubtitlePosition pour obtenir la position en fonction du format
    const verticalPosition = calculateSubtitlePosition(style.position || 50, videoFormat || 'vertical');

    const shadowSizes = [
        'none',
        `${shadowColor}80 0px 0px 8px, ${shadowColor}80 0px 0px 9px, ${shadowColor}80 0px 0px 10px, ${shadowColor}80 0px 0px 11px, ${shadowColor}80 0px 0px 12px`,
        `${shadowColor}80 0px 0px 8px, ${shadowColor}80 0px 0px 10px, ${shadowColor}80 0px 0px 12px, ${shadowColor}80 0px 0px 14px, ${shadowColor}80 0px 0px 16px, ${shadowColor}80 0px 0px 18px`,
        `${shadowColor}80 0px 0px 8px, ${shadowColor}80 0px 0px 11px, ${shadowColor}80 0px 0px 14px, ${shadowColor}80 0px 0px 17px, ${shadowColor}80 0px 0px 20px, ${shadowColor}80 0px 0px 23px, ${shadowColor}80 0px 0px 26px, ${shadowColor}80 0px 0px 29px, ${shadowColor}80 0px 0px 32px`,
        `${shadowColor}80 0px 0px 8px, ${shadowColor}80 0px 0px 12px, ${shadowColor}80 0px 0px 16px, ${shadowColor}80 0px 0px 20px, ${shadowColor}80 0px 0px 24px, ${shadowColor}80 0px 0px 28px, ${shadowColor}80 0px 0px 32px, ${shadowColor}80 0px 0px 36px, ${shadowColor}80 0px 0px 40px, ${shadowColor}80 0px 0px 44px`,
        `${shadowColor}80 0px 0px 8px, ${shadowColor}80 0px 0px 13px, ${shadowColor}80 0px 0px 18px, ${shadowColor}80 0px 0px 23px, ${shadowColor}80 0px 0px 28px, ${shadowColor}80 0px 0px 33px, ${shadowColor}80 0px 0px 38px, ${shadowColor}80 0px 0px 43px, ${shadowColor}80 0px 0px 48px, ${shadowColor}80 0px 0px 53px`,
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
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10,
                    cursor: onPositionChange ? (isDragging ? 'grabbing' : (isHovered ? 'grab' : 'default')) : 'default',
                    userSelect: 'none',
                    touchAction: 'none',
                }}
                onMouseDown={(e) => {
                    setMouseDownTime(Date.now());
                    setHasMoved(false);
                    startDragging(e);
                }}
                onClick={handleSubtitleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {subtitleSequence.lines.map((line: Line, lineIndex: number) => (
                    <div key={lineIndex}>
                        {line.words.map((word: Word, index: number) => {
                            const isWordAlreadyActive = (frame + start) >= word.startInFrames;

                            return (
                                <span 
                                    key={index} 
                                    className="word"
                                    style={{
                                        textAlign: 'center',
                                        lineHeight: '0.8',
                                        opacity: isWordAlreadyActive ? 1 : 0,
                                        color: style.color,
                                        fontSize: `${style.fontSize}px`,
                                        fontStyle: style.isItalic ? 'italic' : 'normal',
                                        textTransform: style.isUppercase ? 'uppercase' as const : 'none' as const,
                                        fontFamily: `${style.fontFamily || 'Montserrat'}, sans-serif`,
                                        fontWeight: style.fontWeight || 700,
                                        textShadow: style.shadow.isActive ? shadowSizes[style.shadow.size] : 'none',
                                    }}>
                                        {word.word}{' '}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </div>
        </AbsoluteFill>
    );
};
