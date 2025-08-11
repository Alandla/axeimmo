import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";
import { useEffect, useState, useCallback, useRef } from "react";
import googleFonts from "../../config/googleFonts.config";
import { VideoFormat, calculateSubtitlePosition } from "../../utils/videoDimensions";

export const SubtitleClean = ({ subtitleSequence, start, style, videoFormat, onPositionChange }: { 
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

    // Fonction pour trouver le player Remotion dans le DOM (mémorisée pour éviter des recherches répétées)
    const findPlayerElement = useCallback(() => {
        // Si on a déjà trouvé le player, on le retourne
        if (playerElementRef.current) {
            return playerElementRef.current;
        }
        
        // Sinon on le cherche
        let el = subtitleRef.current;
        let parent: HTMLElement | null = el?.parentElement || null;
        
        // Remonter dans le DOM jusqu'à trouver l'élément avec la classe remotion-player
        while (parent && !parent.classList.contains('__remotion-player')) {
            parent = parent.parentElement;
        }
        
        // Mémoriser le player pour les prochains appels
        playerElementRef.current = parent;
        return parent;
    }, []);

    // Fonction pour démarrer le glissement
    const startDragging = useCallback((e: React.MouseEvent) => {
        if (!onPositionChange) return;
        
        // Empêcher le comportement par défaut et la propagation
        e.preventDefault();
        e.stopPropagation();
        
        // Trouver et mémoriser le player dès le début du glissement
        const playerElement = findPlayerElement();
        let playerRect = playerElement ? playerElement.getBoundingClientRect() : null;
        
        // Définir l'état de glissement
        setIsDragging(true);
        
        // Position initiale
        const initialY = e.clientY;
        const initialPosition = style.position;
        
        // Fonction de déplacement
        const onMouseMove = (moveEvent: PointerEvent) => {
            // Empêcher le comportement par défaut pour éviter de sélectionner du texte
            moveEvent.preventDefault();
            
            if (playerElement && playerRect) {
                // Mettre à jour le rectangle du player si nécessaire (en cas de redimensionnement)
                playerRect = playerElement.getBoundingClientRect();
                
                // Calculer la position Y relative du curseur à l'intérieur du player
                const relativeY = moveEvent.clientY - playerRect.top;
                
                // Calculer le pourcentage (0-100) de la position dans le player
                const percentageY = (relativeY / playerRect.height) * 100;
                
                // Limiter entre 0 et 100
                const newPosition = Math.round(Math.max(0, Math.min(100, percentageY)));
                
                // Mettre à jour la position via le callback
                onPositionChange(newPosition);
            } else {
                // Fallback à l'ancienne méthode si on ne trouve pas le player
                const deltaY = (moveEvent.clientY - initialY) / 4;
                const newPosition = Math.max(0, Math.min(100, initialPosition + deltaY));
                onPositionChange(newPosition);
            }
        };
        
        // Fonction de fin de glissement
        const onMouseUp = (upEvent: MouseEvent) => {
            // Empêcher la propagation pour éviter le play/pause
            upEvent.preventDefault();
            upEvent.stopPropagation();
            
            setIsDragging(false);
            window.removeEventListener('pointermove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
        
        // Ajouter les écouteurs d'événements globaux
        window.addEventListener('pointermove', onMouseMove, { passive: false });
        window.addEventListener('mouseup', onMouseUp, { passive: false });
    }, [onPositionChange, findPlayerElement, style.position]);

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

    const verticalPosition = calculateSubtitlePosition(style.position || 50, videoFormat || 'vertical');

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
                                    filter: blurValue > 0 ? `blur(${blurValue}px)` : 'none',
                                }}></div>
                            )}
                            
                            {line.words.map((word: Word, index: number) => {
                                const isWordAlreadyActive = (frame+start) >= word.startInFrames;

                                const wordStyle = isWordAlreadyActive && style.activeWord.isActive
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
                                         isWordAlreadyActive && (
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
                                        <span 
                                            className="word"
                                            style={{
                                                ...wordStyle,
                                                position: 'relative',
                                                zIndex: 5,
                                                textAlign: 'center',
                                                lineHeight: '1.2',
                                                filter: blurValue > 0 ? `blur(${blurValue}px)` : 'none',
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