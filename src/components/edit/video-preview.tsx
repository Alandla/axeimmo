import { VideoGenerate } from "@/src/remotion/generateVideo/Composition";
import { IVideo } from "@/src/types/video";
import { Player, PlayerRef } from "@remotion/player";
import { useEffect } from "react";
import { preloadAudio, preloadImage, preloadVideo } from "@remotion/preload";

export default function VideoPreview({ playerRef, video }: { playerRef: React.RefObject<PlayerRef>, video: IVideo | null }) {
    // Calculer l'aspect ratio basé sur les dimensions de la composition
    const aspectRatio = 1280 / 720;

    // Précharger les médias quand la vidéo change
    useEffect(() => {
        if (!video?.video?.sequences) return;

        // Précharger l'audio principal
        if (video.video.audioUrl) {
            preloadAudio(video.video.audioUrl);
        }

        // Précharger tous les médias des séquences
        video.video.sequences.forEach(sequence => {
            if (sequence.media) {
                if (sequence.media.type === 'video' && sequence.media.video?.link) {
                    preloadVideo(sequence.media.video.link);
                } else if (sequence.media.type === 'image' && sequence.media.image?.link) {
                    preloadImage(sequence.media.image.link);
                }
            }
        });
    }, []);

    return (
        <div className="p-4 w-full">
            <div style={{ position: 'relative', width: '100%', paddingTop: `${aspectRatio * 100}%` }}>
                <Player
                    ref={playerRef}
                    component={VideoGenerate}
                    durationInFrames={video?.video?.metadata.audio_duration ? Math.ceil(video?.video?.metadata.audio_duration * 60) : 1}
                    fps={60}
                    compositionWidth={720}
                    compositionHeight={1280}
                    inputProps={{
                        data: video,
                    }}
                    controls
                    className="rounded-lg"
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    }}
                />
            </div>
        </div>
    )
}