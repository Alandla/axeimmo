import { AbsoluteFill, Sequence, OffthreadVideo, Img, interpolate, useCurrentFrame } from "remotion";

export const MediaBackground = ({ sequences }: { sequences: any }) => {
    let currentFrame = 0;
    const frame = useCurrentFrame();

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
                        <Sequence key={index} from={currentFrame} durationInFrames={duration}>
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
                        <Sequence key={index} from={currentFrame} durationInFrames={duration}>
                            <AbsoluteFill>
                                <OffthreadVideo
                                    src={file}
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