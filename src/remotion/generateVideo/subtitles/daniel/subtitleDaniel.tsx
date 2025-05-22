import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Line, Word } from "../../type/subtitle";
import { useEffect, useState, useCallback, useRef } from "react";
import googleFonts from "../../config/googleFonts.config";

export const SubtitleDaniel = ({ subtitleSequence, start, style, onPositionChange }: { subtitleSequence: any, start: number, style: any, onPositionChange?: (position: number) => void }) => {
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

    const verticalPosition = (style.position / 100) * 1750;

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
                onMouseDown={startDragging}
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
