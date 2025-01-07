import { VideoGenerate } from "@/src/remotion/generateVideo/Composition";
import { IVideo } from "@/src/types/video";
import { Player, PlayerRef } from "@remotion/player";
import { useEffect } from "react";
import { preloadAudio, preloadImage, preloadVideo } from "@remotion/preload";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function VideoPreview({ playerRef, video, isMobile, showWatermark }: { playerRef: React.RefObject<PlayerRef>, video: IVideo | null, isMobile: boolean, showWatermark: boolean }) {
    const t = useTranslations('edit')

    useEffect(() => {
        if (!video?.video?.sequences) return;
        
        if (video.video.audio?.voices) {
            video.video.audio.voices.forEach(voice => {
                preloadAudio(voice.url);
            });
        }

        if (video.video.audio?.music?.url) {
            preloadAudio(video.video.audio.music.url);
        }

        if (video.video.avatar?.videoUrl) {
          preloadVideo(video.video.avatar.videoUrl);
        } else if (video.video.avatar?.previewUrl) {
          preloadVideo(video.video.avatar.previewUrl);
        }

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
        <div className={`h-full flex flex-col items-center justify-center ${!isMobile ? 'p-4' : ''}`}>
            {video?.video?.avatar && (
                <div className="text-xs sm:text-sm mb-2 sm:mb-0 w-full rounded-lg border bg-background text-foreground px-4 py-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('lip-sync-export-message')}
                </div>
            )}
            <div className="relative w-full h-full">
                <Player
                    ref={playerRef}
                    component={VideoGenerate}
                    durationInFrames={video?.video?.metadata.audio_duration ? Math.ceil(video?.video?.metadata.audio_duration * 60) : 1}
                    fps={60}
                    compositionWidth={1080}
                    compositionHeight={1920}
                    inputProps={{
                        data: video,
                        showWatermark
                    }}
                    controls
                    className="rounded-lg"
                    style={{
                        width: '100%',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        objectFit: 'contain',
                        maxHeight: '100%',
                    }}
                />
            </div>
        </div>
    )
}