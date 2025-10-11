import { AbsoluteFill, Sequence, OffthreadVideo, Img, interpolate, useCurrentFrame, getRemotionEnvironment } from "remotion";
import { useState, useCallback, useMemo } from "react";
import { MediaSource } from "./MediaSource";
import { calculateZoomScale } from "../utils/zoomUtils";



export const MediaBackground = ({ 
    sequences, 
    onMediaPositionChange,
    onPlayPause 
}: { 
    sequences: any,
    onMediaPositionChange?: (sequenceId: number, position: { x: number, y: number }) => void,
    onPlayPause?: () => void
}) => {
    const frame = useCurrentFrame();
    const [isDragging, setIsDragging] = useState(false);
    const [mouseDownTime, setMouseDownTime] = useState(0);
    const [hasMoved, setHasMoved] = useState(false);
    
    const isPlayer = useMemo(() => getRemotionEnvironment().isPlayer, []);

    // Memoize media position function
    const getMediaPosition = useCallback((sequenceIndex: number) => {
        return sequences[sequenceIndex]?.media?.position || { x: 50, y: 50 };
    }, [sequences]);

    const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
        if (hasMoved || isDragging) return;
        
        const clickDuration = Date.now() - mouseDownTime;
        if (clickDuration > 200) return;
        
        if (onPlayPause) {
            onPlayPause();
        }
    }, [hasMoved, isDragging, mouseDownTime, onPlayPause]);

    const startMediaDrag = useCallback((e: React.MouseEvent, sequenceIndex: number) => {
        if (!isPlayer) return;
        
        e.preventDefault();
        e.stopPropagation();
        setMouseDownTime(Date.now());
        setHasMoved(false);
        setIsDragging(true);
        
        const startX = e.clientX;
        const startY = e.clientY;
        const currentPosition = getMediaPosition(sequenceIndex);
        
        const onPointerMove = (pointerMoveEvent: PointerEvent) => {
            setHasMoved(true);
            const deltaX = (pointerMoveEvent.clientX - startX) / 8;
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
    }, [isPlayer, getMediaPosition, onMediaPositionChange]);

    // Memoize l'ensemble des éléments médias pour éviter les re-renders inutiles
    const mediaElements = useMemo(() => {
        let currentFrame = 0;
        
        return sequences.map((d: any, index: number) => {
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

            if (nextIndex >= sequences.length) {
                duration = 600;
            }

            const mediaPosition = getMediaPosition(index);
            const objectPosition = `${mediaPosition.x}% ${mediaPosition.y}%`;

            const currentFrameInSequence = frame - currentFrame;
            const zoomScale = calculateZoomScale(sequences, index, currentFrameInSequence);

            let element;

            if (media.type === 'image') {
                const file = media.image.link;
                const baseZoomProgress = interpolate(
                    currentFrameInSequence,
                    [0, duration],
                    [1, 1.2],
                    {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                    }
                );

                const finalZoom = baseZoomProgress * zoomScale;

                element = (
                    <Sequence key={index} premountFor={120} from={currentFrame} durationInFrames={duration}>
                        <AbsoluteFill style={{ overflow: 'hidden' }}>
                            <Img
                                src={file}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: objectPosition,
                                    transform: `scale(${finalZoom})`,
                                    pointerEvents: 'none'
                                }}
                            />
                            {media.source && media.source !== 'extracted' && <MediaSource source={media.source} />}
                            {isPlayer && (
                                <AbsoluteFill
                                    style={{
                                        cursor: isDragging ? 'grabbing' : 'grab',
                                        userSelect: 'none',
                                        touchAction: 'none',
                                        zIndex: 2,
                                        pointerEvents: 'auto'
                                    }}
                                    onMouseDown={(e) => {
                                        setMouseDownTime(Date.now());
                                        setHasMoved(false);
                                        startMediaDrag(e, index);
                                    }}
                                    onClick={handleBackgroundClick}
                                />
                            )}
                        </AbsoluteFill>
                    </Sequence>
                );
            } else {
                const file = media.video.link;
                element = (
                    <Sequence key={index} premountFor={120} from={currentFrame} durationInFrames={duration}>
                        <AbsoluteFill style={{ overflow: 'hidden' }}>
                            <OffthreadVideo
                                src={file}
                                startFrom={media.startAt*60 || 0}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: objectPosition,
                                    transform: `scale(${zoomScale})`,
                                    pointerEvents: 'none'
                                }}
                                muted
                            />
                            {media.source && media.source !== 'extracted' && <MediaSource source={media.source} />}
                            {isPlayer && (
                                <AbsoluteFill
                                    style={{
                                        cursor: isDragging ? 'grabbing' : 'grab',
                                        userSelect: 'none',
                                        touchAction: 'none',
                                        zIndex: 2,
                                        pointerEvents: 'auto'
                                    }}
                                    onMouseDown={(e) => {
                                        setMouseDownTime(Date.now());
                                        setHasMoved(false);
                                        startMediaDrag(e, index);
                                    }}
                                    onClick={handleBackgroundClick}
                                />
                            )}
                        </AbsoluteFill>
                    </Sequence>
                );
            }
            currentFrame += duration;
            return element;
        });
    }, [sequences, frame, getMediaPosition, isPlayer, isDragging, handleBackgroundClick, startMediaDrag]);

    return <>{mediaElements}</>;
};