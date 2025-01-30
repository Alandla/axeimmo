import { ITransition } from "@/src/types/video";
import { AbsoluteFill, Sequence, OffthreadVideo, Img, interpolate, useCurrentFrame } from "remotion";

export const MediaBackground = ({ sequences, transition }: { sequences: any, transition: ITransition }) => {
    let currentFrame = 0;
    const frame = useCurrentFrame();

    return (
        <>
            {sequences.map((d: any, index: number) => {
                const media = d.media;
                if (!media) {
                    return null;
                }
                let duration = 0;
                if (index === 0) {
                    duration = transition.fullAt || 0 + 10;
                } else {
                    duration = transition.durationInFrames || 0;
                }

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
                                        transform: `scale(${zoomProgress})`,
                                    }}
                                />
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
                                    }}
                                    muted
                                />
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