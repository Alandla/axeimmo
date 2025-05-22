import { useMemo, useState } from "react";
import { AbsoluteFill, Sequence, OffthreadVideo, Img, interpolate, useCurrentFrame, Loop, getRemotionEnvironment, Video } from "remotion";
import { AvatarLook } from "../type/avatar";

export const BackgroundWithAvatar = ({ 
    sequences, 
    avatar, 
    duration,
    avatarHeightRatio = 50 // Valeur par défaut de 50%
}: { 
    sequences: any, 
    avatar: AvatarLook, 
    duration: number,
    avatarHeightRatio?: number 
}) => {
    const frame = useCurrentFrame();
    const [isHovering, setIsHovering] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [currentRatio, setCurrentRatio] = useState(avatarHeightRatio);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        
        const container = e.currentTarget;
        const containerRect = container.getBoundingClientRect();
        const mouseY = e.clientY - containerRect.top;
        const containerHeight = containerRect.height;
        
        // Calculer le nouveau ratio en pourcentage
        let newRatio = ((containerHeight - mouseY) / containerHeight) * 100;
        
        // Limiter le ratio entre 10 et 95
        newRatio = Math.max(10, Math.min(95, newRatio));
        
        setCurrentRatio(newRatio);
    };

    const { backgroundHeight, mediaElements, showResizeBar } = useMemo(() => {
        let currentFrame = 0;
        let backgroundHeight = currentRatio;
        const mediaElements: any[] = [];
        let showResizeBar = false;

        sequences.forEach((d: any, index: number) => {
            const media = d.media;
            const duration = d.durationInFrames;
            let mediaHeight = currentRatio;
            let zIndex = 0;

            if (media?.show === "half") {
                mediaHeight = 100 - currentRatio;
                if (frame >= currentFrame && frame < currentFrame + duration) {
                    showResizeBar = true;
                }
            } else if (media?.show === "full") {
                mediaHeight = 100;
                zIndex = 2;
            } else {
                currentFrame += duration;
                return;
            }

            if (frame >= currentFrame && frame < currentFrame + duration) {
                backgroundHeight = mediaHeight;
            }

            const zoomProgress = interpolate(
                frame - currentFrame,
                [0, duration],
                [1, 1.2],
                {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                }
            );

            mediaElements.push(
                <Sequence key={index} premountFor={120} from={currentFrame} durationInFrames={duration}>
                    <AbsoluteFill style={{ zIndex: zIndex }}>
                        {media.type === 'image' ? (
                            <Img
                                src={media.image.link}
                                style={{
                                    width: '100%',
                                    height: `${mediaHeight}%`,
                                    objectFit: 'cover',
                                    transform: `scale(${zoomProgress})`,
                                }}
                            />
                        ) : (
                            <OffthreadVideo
                                src={media.video.link}
                                startFrom={media.startAt*60 || 0}
                                style={{
                                    width: '100%',
                                    height: `${mediaHeight}%`,
                                    objectFit: 'cover'
                                }}
                                muted
                            />
                        )}
                    </AbsoluteFill>
                </Sequence>
            );

            currentFrame += duration;
        });

        return { backgroundHeight, mediaElements, showResizeBar };
    }, [frame, sequences, currentRatio]);

    return (
        <div 
            style={{ width: '100%', height: '100%', position: 'relative' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => {
                setIsHovering(false);
                setIsDragging(false);
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
        >
            <Sequence from={0}>
                <AbsoluteFill style={{ zIndex: 1 }}>
                    {avatar.videoUrl ? (
                        <OffthreadVideo
                            src={avatar.videoUrl}
                            style={{
                                width: '100%',
                                height: `${currentRatio}%`,
                                objectFit: 'cover',
                                objectPosition: `${avatar.settings?.position ? avatar.settings?.position : 50}% ${avatar.settings?.verticalPosition ? avatar.settings.verticalPosition : 20}%`,
                                position: 'absolute',
                                bottom: 0,
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
                                    height: `${currentRatio}%`,
                                    objectFit: 'cover',
                                    objectPosition: `${avatar.settings?.position ? avatar.settings?.position : 50}% ${avatar.settings?.verticalPosition ? avatar.settings.verticalPosition : 20}%`,
                                    position: 'absolute',
                                    bottom: 0,
                                }}
                                loop
                                muted
                            />
                        </Loop>
                    )}
                </AbsoluteFill>
            </Sequence>
            {mediaElements}
            
            {/* Barre de redimensionnement modernisée */}
            {isHovering && showResizeBar && (
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        top: `${100 - currentRatio}%`,
                        width: '120px',
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
                        setIsDragging(true);
                    }}
                >
                    {/* Flèche du haut */}
                    <div style={{
                        width: '0',
                        height: '0',
                        borderLeft: '14px solid transparent',
                        borderRight: '14px solid transparent',
                        borderBottom: '14px solid rgba(255, 255, 255, 1)',
                        marginBottom: '6px'
                    }} />

                    {/* Barre centrale */}
                    <div style={{
                        width: '100%',
                        height: '10px',
                        backgroundColor: isDragging ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '5px',
                        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5), 0 0 4px rgba(255, 255, 255, 0.5)',
                        transition: isDragging ? 'none' : 'all 0.2s ease',
                    }} />

                    {/* Flèche du bas */}
                    <div style={{
                        width: '0',
                        height: '0',
                        borderLeft: '14px solid transparent',
                        borderRight: '14px solid transparent',
                        borderTop: '14px solid rgba(255, 255, 255, 1)',
                        marginTop: '6px'
                    }} />

                    {/* Indicateurs latéraux */}
                    <div style={{
                        position: 'absolute',
                        left: '-90px',
                        width: '70px',
                        height: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderRadius: '3px',
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.4), 0 0 3px rgba(255, 255, 255, 0.3)'
                    }} />
                    <div style={{
                        position: 'absolute',
                        right: '-90px',
                        width: '70px',
                        height: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        borderRadius: '3px',
                        boxShadow: '0 0 10px rgba(0, 0, 0, 0.4), 0 0 3px rgba(255, 255, 255, 0.3)'
                    }} />
                </div>
            )}

            {/* Ligne de séparation complète et interactive */}
            {isHovering && showResizeBar && (
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
                        setIsDragging(true);
                    }}
                >
                    <div style={{
                        width: '100%',
                        height: '3px',
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 20%, rgba(255, 255, 255, 0.5) 80%, transparent 100%)',
                        boxShadow: '0 0 15px rgba(0, 0, 0, 0.3)',
                    }} />
                </div>
            )}
        </div>
    );
};