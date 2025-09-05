import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";
import { useState, useCallback, useRef, useEffect } from "react";
import googleFonts from "../../config/googleFonts.config";

export const SubtitleSimple = ({ subtitleSequence, start, style, onPositionChange, onPlayPause }: { subtitleSequence: any, start: number, style: any, onPositionChange?: (position: number) => void, onPlayPause?: () => void }) => {
    const frame = useCurrentFrame();
    const [isDragging, setIsDragging] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [mouseDownTime, setMouseDownTime] = useState(0);
    const [hasMoved, setHasMoved] = useState(false);
    const subtitleRef = useRef<SVGSVGElement>(null);
    const playerElementRef = useRef<HTMLElement | null>(null);

    // Function to find the Remotion player element in the DOM (memoized to avoid repeated searches)
    const findPlayerElement = useCallback(() => {
        // If we already found the player, return it
        if (playerElementRef.current) {
            return playerElementRef.current;
        }
        
        // Otherwise, search for it
        let el = subtitleRef.current;
        let parent: HTMLElement | null = el?.parentElement as HTMLElement || null;
        
        // Traverse the DOM upwards until we find the element with the remotion-player class
        while (parent && !parent.classList.contains('__remotion-player')) {
            parent = parent.parentElement;
        }
        
        // Store the player for future calls
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

    // Function to start dragging
    const startDragging = useCallback((e: React.MouseEvent) => {
        if (!onPositionChange) return;
        
        // Prevent default behavior and propagation
        e.preventDefault();
        e.stopPropagation();
        
        setMouseDownTime(Date.now());
        setHasMoved(false);
        
        // Find and store the player element at the beginning of the drag
        const playerElement = findPlayerElement();
        let playerRect = playerElement ? playerElement.getBoundingClientRect() : null;
        
        // Set dragging state
        setIsDragging(true);
        
        // Initial position
        const initialY = e.clientY;
        const initialPosition = style.position;
        
        // Mouse move function
        const onMouseMove = (moveEvent: PointerEvent) => {
            // Prevent default to avoid selecting text
            moveEvent.preventDefault();
            
            setHasMoved(true);
            
            if (playerElement && playerRect) {
                // Update the player rect if necessary (in case of resize)
                playerRect = playerElement.getBoundingClientRect();
                
                // Calculate the relative Y position of the cursor within the player
                const relativeY = moveEvent.clientY - playerRect.top;
                
                // Calculate the percentage (0-100) of the position within the player
                const percentageY = (relativeY / playerRect.height) * 100;
                
                // Limit between 0 and 100
                const newPosition = Math.round(Math.max(0, Math.min(100, percentageY)));
                
                // Update the position via the callback
                onPositionChange(newPosition);
            } else {
                // Fallback to the old method if the player is not found
                const deltaY = (moveEvent.clientY - initialY) / 4;
                const newPosition = Math.max(0, Math.min(100, initialPosition + deltaY));
                onPositionChange(newPosition);
            }
        };
        
        // Mouse up function
        const onMouseUp = (upEvent: MouseEvent) => {
            // Prevent propagation to avoid play/pause
            upEvent.preventDefault();
            upEvent.stopPropagation();
            
            setIsDragging(false);
            window.removeEventListener('pointermove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        
        // Add global event listeners
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
    
    return (
        <AbsoluteFill>
            <svg 
                width="100%" 
                height="100%" 
                style={{ 
                    zIndex: 10,
                    pointerEvents: 'none', // Le SVG ne capture pas les événements
                }}
                ref={subtitleRef}
            >
                {subtitleSequence.lines.map((line: Line, lineIndex: number) => (
                    <text 
                        key={lineIndex}
                        x="50%" 
                        y={`${style.position + (lineIndex * 4)}%`}
                        textAnchor="middle" 
                        dominantBaseline="middle"
                        style={{
                            pointerEvents: 'auto', // Le texte capture les événements
                            cursor: onPositionChange ? (isDragging ? 'grabbing' : (isHovered ? 'grab' : 'default')) : 'default',
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
                        <tspan>
                            {line.words.map((word: Word, index: number) => {
                                const isWordActive = (frame+start) >= word.startInFrames && (frame+start) < (word.startInFrames + word.durationInFrames);

                                const wordStyle = isWordActive && style?.activeWord?.isActive
                                    ? {
                                        fill: style?.activeWord?.color,
                                        fontSize: `${style?.activeWord?.fontSize}px`,
                                        fontStyle: style?.activeWord?.isItalic ? 'italic' : 'normal',
                                        fontFamily: `${style?.activeWord?.fontFamily || 'Montserrat'}, sans-serif`,
                                        fontWeight: style?.activeWord?.fontWeight || 700,
                                      }
                                    : {
                                        fill: style?.color,
                                        fontSize: `${style?.fontSize}px`,
                                        fontStyle: style?.isItalic ? 'italic' : 'normal',
                                        fontFamily: `${style?.fontFamily || 'Montserrat'}, sans-serif`,
                                        fontWeight: style?.fontWeight || 700,
                                      };
                                      
                                return (
                                    <tspan 
                                        key={index}
                                        paintOrder="stroke"
                                        stroke={style?.border?.isActive ? style?.border?.color : 'transparent'}
                                        strokeWidth={style?.border?.size}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        {...wordStyle}
                                    >
                                        {(isWordActive && style?.activeWord?.isActive && style?.activeWord?.isUppercase) ? word.word.toUpperCase() : (style?.isUppercase ? word.word.toUpperCase() : word.word)}{' '}
                                    </tspan>
                                )
                            })}
                        </tspan>
                    </text>
                ))}
            </svg>
        </AbsoluteFill>
    );
};