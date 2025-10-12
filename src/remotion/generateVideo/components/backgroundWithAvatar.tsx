import { useMemo, useState, useRef, useCallback } from "react";
import { AbsoluteFill, Sequence, OffthreadVideo, Img, interpolate, useCurrentFrame, Loop, getRemotionEnvironment, Video } from "remotion";
import { AvatarLook } from "../type/avatar";
import { MediaSource } from "./MediaSource";
import { calculateZoomScale } from "../utils/zoomUtils";
import { VideoFormat } from "../utils/videoDimensions";

export const BackgroundWithAvatar = ({
    sequences, 
    avatar, 
    duration,
    avatarHeightRatio = 50,
    videoFormat = 'vertical',
    onAvatarHeightRatioChange,
    onAvatarPositionChange,
    onMediaPositionChange,
    onPlayPause
}: {
    sequences: any, 
    avatar: AvatarLook, 
    duration: number,
    avatarHeightRatio?: number,
    videoFormat?: VideoFormat,
    onAvatarHeightRatioChange?: (ratio: number) => void,
    onAvatarPositionChange?: (position: { x: number, y: number }) => void,
    onMediaPositionChange?: (sequenceId: number, position: { x: number, y: number }) => void,
    onPlayPause?: () => void
}) => {
    const frame = useCurrentFrame();
    const [isHovering, setIsHovering] = useState(false);
    const [isDraggingResizeBar, setIsDraggingResizeBar] = useState(false);
    const [mouseDownTime, setMouseDownTime] = useState(0);
    const [hasMoved, setHasMoved] = useState(false);
    
    const avatarRef = useRef<HTMLDivElement>(null);
    const mediaRefs = useRef<{[key: number]: HTMLDivElement}>({});

    // Determine if we're in horizontal mode
    const isHorizontal = videoFormat === 'horizontal';
    
    // Check if we're in player mode (for interaction features)
    const isPlayer = getRemotionEnvironment().isPlayer;

    // Get current values from props
    const currentRatio = avatarHeightRatio;
    const avatarPosition = {
        x: avatar.settings?.position || 50,
        y: avatar.settings?.verticalPosition || 20
    };
    
    // Get media positions from sequences
    const getMediaPosition = useCallback((sequenceIndex: number) => {
        return sequences[sequenceIndex]?.media?.position || { x: 50, y: 50 };
    }, [sequences]);

    const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
        if (hasMoved || isDraggingResizeBar) return;
        
        const clickDuration = Date.now() - mouseDownTime;
        if (clickDuration > 200) return;
        
        if (onPlayPause) {
            onPlayPause();
        }
    }, [hasMoved, isDraggingResizeBar, mouseDownTime, onPlayPause]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (isDraggingResizeBar) {
            const container = e.currentTarget;
            const containerRect = container.getBoundingClientRect();
            let newRatio;
            
            if (isHorizontal) {
                const mouseX = e.clientX - containerRect.left;
                const containerWidth = containerRect.width;
                newRatio = (mouseX / containerWidth) * 100;
            } else {
                const mouseY = e.clientY - containerRect.top;
                const containerHeight = containerRect.height;
                newRatio = ((containerHeight - mouseY) / containerHeight) * 100;
            }
            
            newRatio = Math.max(10, Math.min(95, newRatio));
            if (onAvatarHeightRatioChange) {
                onAvatarHeightRatioChange(newRatio);
            }
        }
    }, [isDraggingResizeBar, isHorizontal, onAvatarHeightRatioChange]);

    const startMediaDrag = useCallback((e: React.MouseEvent, sequenceId: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        setMouseDownTime(Date.now());
        setHasMoved(false);
        
        const mediaElement = mediaRefs.current[sequenceId];
        if (!mediaElement) return;
        
        const mediaRect = mediaElement.getBoundingClientRect();
        
        const onPointerMove = (pointerMoveEvent: PointerEvent) => {
            setHasMoved(true);
            const newX = 100 - ((pointerMoveEvent.clientX - mediaRect.left) / mediaRect.width) * 100;
            const newY = 100 - ((pointerMoveEvent.clientY - mediaRect.top) / mediaRect.height) * 100;
            const clampedX = Math.max(0, Math.min(100, newX));
            const clampedY = Math.max(0, Math.min(100, newY));
            
            const newPosition = { x: clampedX, y: clampedY };
            if (onMediaPositionChange) {
                onMediaPositionChange(sequenceId, newPosition);
            }
        };

        const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { once: true });
    }, [onMediaPositionChange]);

    const startAvatarDrag = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setMouseDownTime(Date.now());
        setHasMoved(false);
        
        if (!avatarRef.current) return;
        
        const containerRect = avatarRef.current.getBoundingClientRect();
        
        const onPointerMove = (pointerMoveEvent: PointerEvent) => {
            setHasMoved(true);
            const newX = 100 - ((pointerMoveEvent.clientX - containerRect.left) / containerRect.width) * 100;
            const newY = 100 - ((pointerMoveEvent.clientY - containerRect.top) / containerRect.height) * 100;
            const clampedX = Math.max(0, Math.min(100, newX));
            const clampedY = Math.max(0, Math.min(100, newY));
            
            const newPosition = { x: clampedX, y: clampedY };
            if (onAvatarPositionChange) {
                onAvatarPositionChange(newPosition);
            }
        };

        const onPointerUp = () => {
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
        };

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { once: true });
    }, [onAvatarPositionChange]);

    const { mediaElements, showResizeBar, isCurrentMediaHidden } = useMemo(() => {
        let currentFrame = 0;
        const mediaElementsArray: any[] = [];
        let shouldShowResizeBar = false;
        let currentMediaHidden = true; // Par défaut, considérer comme masqué

        sequences.forEach((d: any, index: number) => {
            const media = d.media;
            const sequenceDuration = d.durationInFrames;
            let zIndex = 1;
            let mediaSequenceStyle: React.CSSProperties = {};

            // Vérifier si on est dans cette séquence
            if (frame >= currentFrame && frame < currentFrame + sequenceDuration) {
                currentMediaHidden = !media?.show || (media?.show !== "half" && media?.show !== "full");
            }

            if (media?.show === "half") {
                if (isHorizontal) {
                    // Horizontal layout: media takes left side
                    const mediaWidthPercentage = currentRatio;
                    mediaSequenceStyle = {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: `${mediaWidthPercentage}%`,
                        height: '100%'
                    };
                } else {
                    // Vertical layout: media takes top side
                    const mediaHeightPercentage = 100 - currentRatio;
                    mediaSequenceStyle = {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${mediaHeightPercentage}%`
                    };
                }
                zIndex = 1;
                if (frame >= currentFrame && frame < currentFrame + sequenceDuration) {
                    shouldShowResizeBar = true;
                }
            } else if (media?.show === "full") {
                mediaSequenceStyle = { position: 'absolute', inset: 0 }; // Fullscreen
                zIndex = 2;
            } else {
                currentFrame += sequenceDuration;
                return;
            }

            // Calculate zoom scale for this sequence based on words
            const currentFrameInSequence = frame - currentFrame;
            // Only apply zoom to media when in full screen mode, not in split screen (half)
            const mediaZoomScale = media?.show === "full" 
                ? calculateZoomScale(sequences, index, currentFrameInSequence)
                : 1.0;

            const mediaPosition = getMediaPosition(index);
            const objectPosition = `${mediaPosition.x}% ${mediaPosition.y}%`;

            mediaElementsArray.push(
                <Sequence 
                    key={index} 
                    premountFor={60} 
                    from={currentFrame} 
                    durationInFrames={sequenceDuration}
                    style={mediaSequenceStyle}
                >
                    <AbsoluteFill style={{ zIndex: zIndex }}>
                        <div 
                            ref={el => { if (el) mediaRefs.current[index] = el; }}
                            style={{ 
                                width: '100%', 
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'move' 
                            }}
                            onMouseDown={(e) => {
                                if (isPlayer) {
                                    e.preventDefault();
                                    startMediaDrag(e, index);
                                }
                            }}
                        >
                            {media.type === 'image' ? (
                                <Img
                                    src={media.image.link}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: objectPosition,
                                        transform: `scale(${mediaZoomScale})`,
                                    }}
                                />
                            ) : (
                                <OffthreadVideo
                                    src={media.video.link}
                                    startFrom={media.startAt*60 || 0}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: objectPosition,
                                        transform: `scale(${mediaZoomScale})`,
                                    }}
                                    muted
                                />
                            )}
                            {media.source && media.source !== 'extracted' && <MediaSource source={media.source} />}
                        </div>
                    </AbsoluteFill>
                </Sequence>
            );
            currentFrame += sequenceDuration;
        });
        return { mediaElements: mediaElementsArray, showResizeBar: shouldShowResizeBar, isCurrentMediaHidden: currentMediaHidden };
    }, [frame, sequences, currentRatio]);

    // Calculate current sequence and zoom for avatar
    const { currentSequenceIndex, currentFrameInSequence, avatarZoomScale } = useMemo(() => {
        let frameCounter = 0;
        let activeSequenceIndex = -1;
        let frameInSequence = 0;
        let zoomScale = 1.0;
        
        // Find which sequence we're currently in
        for (let i = 0; i < sequences.length; i++) {
            const sequenceDuration = sequences[i].durationInFrames;
            if (frame >= frameCounter && frame < frameCounter + sequenceDuration) {
                activeSequenceIndex = i;
                frameInSequence = frame - frameCounter;
                // Calculate zoom for this sequence
                zoomScale = calculateZoomScale(sequences, i, frameInSequence);
                break;
            }
            frameCounter += sequenceDuration;
        }
        
        return {
            currentSequenceIndex: activeSequenceIndex,
            currentFrameInSequence: frameInSequence,
            avatarZoomScale: zoomScale
        };
    }, [frame, sequences]);

    const avatarSequenceStyle: React.CSSProperties = useMemo(() => ({
        position: 'absolute' as const,
        ...(isHorizontal 
            ? {
                // Horizontal layout: avatar takes right side
                top: 0,
                left: isCurrentMediaHidden ? 0 : `${currentRatio}%`,
                width: isCurrentMediaHidden ? '100%' : `${100 - currentRatio}%`,
                height: '100%'
            }
            : {
                // Vertical layout: avatar takes bottom side
                top: isCurrentMediaHidden ? 0 : `${100 - currentRatio}%`,
                left: 0,
                width: '100%',
                height: isCurrentMediaHidden ? '100%' : `${currentRatio}%`
            }
        )
    }), [isHorizontal, isCurrentMediaHidden, currentRatio]);
    
    const avatarAbsoluteFillStyle: React.CSSProperties = useMemo(() => ({ zIndex: 1 }), []);

    return (
        <div 
            style={{ width: '100%', height: '100%', position: 'relative' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
                setIsHovering(false);
                setIsDraggingResizeBar(false);
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={() => {
                setIsDraggingResizeBar(false);
            }}
            onMouseDown={(e) => {
                if (isPlayer) {
                    setMouseDownTime(Date.now());
                    setHasMoved(false);
                }
            }}
            onClick={handleBackgroundClick}
        >
            {/* Media Elements - Rendered first in JSX order */} 
            {mediaElements}
            
            {/* Avatar Sequence - Rendered second in JSX order */}
            {avatar.renders && avatar.renders.length > 0 ? (
                // New method: multiple renders
                <div style={avatarSequenceStyle}>
                    <AbsoluteFill style={avatarAbsoluteFillStyle}>
                        <div 
                            ref={avatarRef}
                            style={{ 
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'move'
                            }}
                            onMouseDown={(e) => {
                                if (isPlayer) {
                                    e.preventDefault();
                                    startAvatarDrag(e);
                                }
                            }}
                        >
                            {avatar.renders.map((render: any, index: number) => {
                                let renderDuration: number;
                                if (render.durationInSeconds) {
                                    renderDuration = Math.ceil(render.durationInSeconds * 60);
                                } else {
                                    const nextRender = avatar.renders![index + 1];
                                    renderDuration = nextRender 
                                        ? nextRender.startInFrames - render.startInFrames
                                        : (duration * 60) - render.startInFrames;
                                }

                                return (
                                    <Sequence
                                        key={index}
                                        from={render.startInFrames}
                                        durationInFrames={renderDuration}
                                        premountFor={60}
                                    >
                                        <OffthreadVideo
                                            src={render.url}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%`,
                                                transform: `scale(${avatarZoomScale})`,
                                            }}
                                            muted
                                        />
                                    </Sequence>
                                );
                            })}
                        </div>
                    </AbsoluteFill>
                </div>
            ) : (
                // Old method: single video/preview/image
                <Sequence 
                    from={0} 
                    durationInFrames={duration * 60} 
                    style={avatarSequenceStyle}
                >
                    <AbsoluteFill style={avatarAbsoluteFillStyle}>
                        <div 
                            ref={avatarRef}
                            style={{ 
                                width: '100%',
                                height: '100%',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'move'
                            }}
                            onMouseDown={(e) => {
                                if (isPlayer) {
                                    e.preventDefault();
                                    startAvatarDrag(e);
                                }
                            }}
                        >
                            {avatar.videoUrl ? (
                                <OffthreadVideo
                                    src={avatar.videoUrl}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%`,
                                        transform: `scale(${avatarZoomScale})`,
                                    }}
                                    muted
                                />
                            ) : avatar.previewUrl ? (
                                <Loop durationInFrames={Math.ceil(duration * 60)}>
                                    <Video
                                        src={avatar.previewUrl}
                                        startFrom={0}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%`,
                                            transform: `scale(${avatarZoomScale})`,
                                        }}
                                        loop
                                        muted
                                    />
                                </Loop>
                            ) : (
                                <Img
                                    src={avatar.thumbnail}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%`,
                                        transform: `scale(${avatarZoomScale})`,
                                    }}
                                />
                            )}
                        </div>
                    </AbsoluteFill>
                </Sequence>
            )}
            
            {/* Resize Bar */} 
            {isPlayer && isHovering && showResizeBar && (
                <div
                    style={{
                        position: 'absolute',
                        ...(isHorizontal 
                            ? {
                                // Horizontal layout: vertical bar between left and right
                                top: '50%',
                                transform: 'translateY(-50%)',
                                left: `${currentRatio}%`,
                                width: '50px',
                                height: '160px',
                                cursor: 'col-resize',
                                flexDirection: 'row',
                                marginLeft: '-25px',
                            }
                            : {
                                // Vertical layout: horizontal bar between top and bottom
                                left: '50%',
                                transform: 'translateX(-50%)',
                                top: `${100 - currentRatio}%`,
                                width: '160px',
                                height: '50px',
                                cursor: 'row-resize',
                                flexDirection: 'column',
                                marginTop: '-25px',
                            }
                        ),
                        zIndex: 3, // Barre de redimensionnement sous les sous-titres
                        display: 'flex',
                        alignItems: 'center',
                        filter: 'drop-shadow(0 0 12px rgba(0, 0, 0, 0.6))',
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingResizeBar(true);
                    }}
                >
                    {isHorizontal ? (
                        // Horizontal layout arrows (left and right)
                        <>
                            <div style={{ width: '0', height: '0', borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderRight: '14px solid rgba(255, 255, 255, 1)', marginRight: '6px' }} />
                            <div style={{ width: '10px', height: '100%', backgroundColor: isDraggingResizeBar ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.95)', borderRadius: '5px', boxShadow: '0 0 20px rgba(0, 0, 0, 0.5), 0 0 4px rgba(255, 255, 255, 0.5)', transition: isDraggingResizeBar ? 'none' : 'all 0.2s ease' }} />
                            <div style={{ width: '0', height: '0', borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderLeft: '14px solid rgba(255, 255, 255, 1)', marginLeft: '6px' }} />
                        </>
                    ) : (
                        // Vertical layout arrows (up and down)
                        <>
                            <div style={{ width: '0', height: '0', borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderBottom: '14px solid rgba(255, 255, 255, 1)', marginBottom: '6px' }} />
                            <div style={{ width: '100%', height: '10px', backgroundColor: isDraggingResizeBar ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.95)', borderRadius: '5px', boxShadow: '0 0 20px rgba(0, 0, 0, 0.5), 0 0 4px rgba(255, 255, 255, 0.5)', transition: isDraggingResizeBar ? 'none' : 'all 0.2s ease' }} />
                            <div style={{ width: '0', height: '0', borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '14px solid rgba(255, 255, 255, 1)', marginTop: '6px' }} />
                        </>
                    )}
                </div>
            )}

            {/* Separator Line */} 
            {isPlayer && isHovering && showResizeBar && (
                <div
                    style={{
                        position: 'absolute',
                        ...(isHorizontal 
                            ? {
                                // Horizontal layout: vertical separator line
                                top: 0,
                                bottom: 0,
                                left: `${currentRatio}%`,
                                width: '20px',
                                cursor: 'col-resize',
                                transform: 'translateX(-50%)',
                                justifyContent: 'center',
                            }
                            : {
                                // Vertical layout: horizontal separator line
                                left: 0,
                                right: 0,
                                top: `${100 - currentRatio}%`,
                                height: '20px',
                                cursor: 'row-resize',
                                transform: 'translateY(-50%)',
                                alignItems: 'center',
                            }
                        ),
                        zIndex: 2, // Ligne de séparation sous les sous-titres
                        display: 'flex',
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingResizeBar(true);
                    }}
                >
                    {isHorizontal ? (
                        // Vertical separator line for horizontal layout
                        <div style={{ width: '3px', height: '100%', background: 'linear-gradient(0deg, transparent 0%, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 255, 0.5) 80%, transparent 100%)', boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)' }} />
                    ) : (
                        // Horizontal separator line for vertical layout
                        <div style={{ width: '100%', height: '3px', background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 255, 0.5) 80%, transparent 100%)', boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)' }} />
                    )}
                </div>
            )}
        </div>
    );
};