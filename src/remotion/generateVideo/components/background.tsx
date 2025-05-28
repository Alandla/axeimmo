import { AbsoluteFill, Sequence, OffthreadVideo, Img, interpolate, useCurrentFrame, getRemotionEnvironment } from "remotion";
import { useState, useCallback } from "react";
import { MediaSource } from "./MediaSource";

export const MediaBackground = ({ 
    sequences, 
    onMediaPositionChange 
}: { 
    sequences: any,
    onMediaPositionChange?: (sequenceId: number, position: { x: number, y: number }) => void
}) => {
    let currentFrame = 0;
    const frame = useCurrentFrame();
    const [isDragging, setIsDragging] = useState(false);

    // Get media position from sequence data
    const getMediaPosition = (sequenceIndex: number) => {
        return sequences[sequenceIndex]?.media?.position || { x: 50, y: 50 };
    };

    const startMediaDrag = useCallback((e: React.MouseEvent, sequenceIndex: number) => {
        if (!getRemotionEnvironment().isPlayer) return;
        
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        
        const startX = e.clientX;
        const startY = e.clientY;
        const currentPosition = getMediaPosition(sequenceIndex);
        
        const onPointerMove = (pointerMoveEvent: PointerEvent) => {
            const deltaX = (pointerMoveEvent.clientX - startX) / 8; // Sensibilité réduite
            const deltaY = (pointerMoveEvent.clientY - startY) / 8;
            
            const newX = Math.max(0, Math.min(100, currentPosition.x + deltaX));
            const newY = Math.max(0, Math.min(100, currentPosition.y + deltaY));
            
            const newPosition = { x: newX, y: newY };
            if (onMediaPositionChange) {
                onMediaPositionChange(sequenceIndex, newPosition);
            }
        };

        const onPointerUp = () => {
            setIsDragging(false);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { once: true });
    }, [sequences, onMediaPositionChange]);

    const isPlayer = getRemotionEnvironment().isPlayer;

    return (
        <>
            {sequences.map((d: any, index: number) => {
                const media = d.media;
                if (!media) {
                    return null;
                }
                let duration = d.durationInFrames;
                
                let nextIndex = index + 1;
                while (nextIndex < sequences.length && !sequences[nextIndex].media) {
                    duration += sequences[nextIndex].durationInFrames;
                    nextIndex++;
                }

                // Si c'est la dernière séquence avec un média
                if (nextIndex >= sequences.length) {
                    // Ajuster la durée pour aller jusqu'à la fin
                    duration = 600;
                }

                const mediaPosition = getMediaPosition(index);
                const objectPosition = `${mediaPosition.x}% ${mediaPosition.y}%`;

                let element;

                if (media.type === 'image') {
                    const file = media.image.link;
                    const zoomProgress = interpolate(
                        frame - currentFrame,
                        [0, duration],
                        [1, 1.2],
                        {
                            extrapolateLeft: 'clamp',
                            extrapolateRight: 'clamp',
                        }
                    );

                    element = (
                        <Sequence key={index} premountFor={120} from={currentFrame} durationInFrames={duration}>
                            <AbsoluteFill>
                                <Img
                                    src={file}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: objectPosition,
                                        transform: `scale(${zoomProgress})`,
                                        pointerEvents: 'none'
                                    }}
                                />
                                {media.source && <MediaSource source={media.source} />}
                                {/* Overlay pour capturer les événements de drag */}
                                {isPlayer && (
                                    <AbsoluteFill
                                        style={{
                                            cursor: isDragging ? 'grabbing' : 'grab',
                                            userSelect: 'none',
                                            touchAction: 'none',
                                            zIndex: 10,
                                            pointerEvents: 'auto'
                                        }}
                                        onMouseDown={(e) => startMediaDrag(e, index)}
                                    />
                                )}
                            </AbsoluteFill>
                        </Sequence>
                    );
                } else {
                    const file = media.video.link;
                    element = (
                        <Sequence key={index} premountFor={120} from={currentFrame} durationInFrames={duration}>
                            <AbsoluteFill>
                                <OffthreadVideo
                                    src={file}
                                    startFrom={media.startAt*60 || 0}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: objectPosition,
                                        pointerEvents: 'none'
                                    }}
                                    muted
                                />
                                {media.source && <MediaSource source={media.source} />}
                                {/* Overlay pour capturer les événements de drag */}
                                {isPlayer && (
                                    <AbsoluteFill
                                        style={{
                                            cursor: isDragging ? 'grabbing' : 'grab',
                                            userSelect: 'none',
                                            touchAction: 'none',
                                            zIndex: 10,
                                            pointerEvents: 'auto'
                                        }}
                                        onMouseDown={(e) => startMediaDrag(e, index)}
                                    />
                                )}
                            </AbsoluteFill>
                        </Sequence>
                    );
                }
                currentFrame += duration;
                return element;
            })}
        </>
    );
};