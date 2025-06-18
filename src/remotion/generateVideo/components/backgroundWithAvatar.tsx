import { useMemo, useState, useRef } from "react";
import { AbsoluteFill, Sequence, OffthreadVideo, Img, interpolate, useCurrentFrame, Loop, getRemotionEnvironment, Video } from "remotion";
import { AvatarLook } from "../type/avatar";
import { MediaSource } from "./MediaSource";

export const BackgroundWithAvatar = ({
    sequences, 
    avatar, 
    duration,
    avatarHeightRatio = 50,
    onAvatarHeightRatioChange,
    onAvatarPositionChange,
    onMediaPositionChange
}: {
    sequences: any, 
    avatar: AvatarLook, 
    duration: number,
    avatarHeightRatio?: number,
    onAvatarHeightRatioChange?: (ratio: number) => void,
    onAvatarPositionChange?: (position: { x: number, y: number }) => void,
    onMediaPositionChange?: (sequenceId: number, position: { x: number, y: number }) => void
}) => {
    const frame = useCurrentFrame();
    const [isHovering, setIsHovering] = useState(false);
    const [isDraggingResizeBar, setIsDraggingResizeBar] = useState(false);
    
    const avatarRef = useRef<HTMLDivElement>(null);
    const mediaRefs = useRef<{[key: number]: HTMLDivElement}>({});

    // Get current values from props
    const currentRatio = avatarHeightRatio;
    const avatarPosition = {
        x: avatar.settings?.position || 50,
        y: avatar.settings?.verticalPosition || 20
    };
    
    // Get media positions from sequences
    const getMediaPosition = (sequenceIndex: number) => {
        return sequences[sequenceIndex]?.media?.position || { x: 50, y: 50 };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isDraggingResizeBar) {
            const container = e.currentTarget;
            const containerRect = container.getBoundingClientRect();
            const mouseY = e.clientY - containerRect.top;
            const containerHeight = containerRect.height;
            let newRatio = ((containerHeight - mouseY) / containerHeight) * 100;
            newRatio = Math.max(10, Math.min(95, newRatio));
            if (onAvatarHeightRatioChange) {
                onAvatarHeightRatioChange(newRatio);
            }
        }
    };

    const startMediaDrag = (e: React.MouseEvent, sequenceId: number) => {
        e.preventDefault();
        e.stopPropagation();
        
        const mediaElement = mediaRefs.current[sequenceId];
        if (!mediaElement) return;
        
        const mediaRect = mediaElement.getBoundingClientRect();
        
        const onPointerMove = (pointerMoveEvent: PointerEvent) => {
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
    };

    const startAvatarDrag = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!avatarRef.current) return;
        
        const containerRect = avatarRef.current.getBoundingClientRect();
        
        const onPointerMove = (pointerMoveEvent: PointerEvent) => {
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
    };

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
                const mediaHeightPercentage = 100 - currentRatio;
                mediaSequenceStyle = {
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${mediaHeightPercentage}%`
                };
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

            const zoomProgress = interpolate(
                frame - currentFrame,
                [0, sequenceDuration],
                [1, 1.2],
                { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );

            const mediaPosition = getMediaPosition(index);
            const objectPosition = `${mediaPosition.x}% ${mediaPosition.y}%`;

            mediaElementsArray.push(
                <Sequence 
                    key={index} 
                    premountFor={120} 
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
                                if (getRemotionEnvironment().isPlayer) {
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
                                        transform: `scale(${zoomProgress})`,
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
                                        objectPosition: objectPosition
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

    const avatarSequenceStyle: React.CSSProperties = {
        position: 'absolute',
        top: isCurrentMediaHidden ? 0 : `${100 - currentRatio}%`,
        left: 0,
        width: '100%',
        height: isCurrentMediaHidden ? '100%' : `${currentRatio}%`
    };
    const avatarAbsoluteFillStyle: React.CSSProperties = { zIndex: 1 };

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
        >
            {/* Media Elements - Rendered first in JSX order */} 
            {mediaElements}
            
            {/* Avatar Sequence - Rendered second in JSX order */} 
            <Sequence 
                from={0} 
                durationInFrames={duration * 60} 
                style={avatarSequenceStyle} // Apply style to Sequence
            >
                <AbsoluteFill style={avatarAbsoluteFillStyle}> {/* Style only for zIndex */}
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
                            if (getRemotionEnvironment().isPlayer) {
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
                                }}
                                muted
                            />
                        ) : (
                            <Loop durationInFrames={Math.ceil(duration * 60)}>
                                <Video
                                    src={avatar.previewUrl}
                                    startFrom={0}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%`,
                                    }}
                                    loop
                                    muted
                                />
                            </Loop>
                        )}
                    </div>
                </AbsoluteFill>
            </Sequence>
            
            {/* Resize Bar */} 
            {getRemotionEnvironment().isPlayer && isHovering && showResizeBar && (
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: `${100 - currentRatio}%`,
                        width: '160px',
                        height: '50px',
                        cursor: 'row-resize',
                        zIndex: 1000,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginTop: '-25px',
                        filter: 'drop-shadow(0 0 12px rgba(0, 0, 0, 0.6))',
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingResizeBar(true);
                    }}
                >
                    <div style={{ width: '0', height: '0', borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderBottom: '14px solid rgba(255, 255, 255, 1)', marginBottom: '6px' }} />
                    <div style={{ width: '100%', height: '10px', backgroundColor: isDraggingResizeBar ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.95)', borderRadius: '5px', boxShadow: '0 0 20px rgba(0, 0, 0, 0.5), 0 0 4px rgba(255, 255, 255, 0.5)', transition: isDraggingResizeBar ? 'none' : 'all 0.2s ease' }} />
                    <div style={{ width: '0', height: '0', borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '14px solid rgba(255, 255, 255, 1)', marginTop: '6px' }} />
                </div>
            )}

            {/* Separator Line */} 
            {getRemotionEnvironment().isPlayer && isHovering && showResizeBar && (
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: `${100 - currentRatio}%`,
                        height: '20px',
                        cursor: 'row-resize',
                        zIndex: 998,
                        display: 'flex',
                        alignItems: 'center',
                        transform: 'translateY(-50%)',
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingResizeBar(true);
                    }}
                >
                    <div style={{ width: '100%', height: '3px', background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 255, 0.5) 80%, transparent 100%)', boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)' }} />
                </div>
            )}
        </div>
    );
};