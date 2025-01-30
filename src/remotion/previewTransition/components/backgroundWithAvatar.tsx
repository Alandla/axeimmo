import { useMemo } from "react";
import { AbsoluteFill, Sequence, OffthreadVideo, Img, interpolate, useCurrentFrame, Loop, Video } from "remotion";
import { AvatarLook } from "../type/avatar";

export const BackgroundWithAvatar = ({ sequences, avatar, duration }: { sequences: any, avatar: AvatarLook, duration: number }) => {
    const frame = useCurrentFrame();

    const { backgroundHeight, mediaElements } = useMemo(() => {
        let currentFrame = 0;
        let backgroundHeight = 100;
        const mediaElements: any[] = [];

        sequences.forEach((d: any, index: number) => {
            const media = d.media;
            const duration = d.durationInFrames;
            let mediaHeight = 100;
            let zIndex = 0;

            if (media?.show === "half") {
                mediaHeight = 50;
            } else if (media?.show === "full") {
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

        return { backgroundHeight, mediaElements };
    }, [frame, sequences]);

    return (
        <>
            <Sequence from={0}>
                <AbsoluteFill style={{ zIndex: 1 }}>
                        {avatar.videoUrl ? (
                            <OffthreadVideo
                                src={avatar.videoUrl}
                                style={{
                                    width: '100%',
                                    height: `${backgroundHeight}%`,
                                    objectFit: 'cover',
                                    objectPosition: `${avatar.settings?.position ? avatar.settings?.position : 50}% ${100 - 80}%`,
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
                                        height: `${backgroundHeight}%`,
                                        objectFit: 'cover',
                                        objectPosition: `${avatar.settings?.position ? avatar.settings?.position : 50}% ${100 - 80}%`,
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
        </>
    );
};