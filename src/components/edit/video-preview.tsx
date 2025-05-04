import { VideoGenerate } from "@/src/remotion/generateVideo/Composition";
import { IVideo } from "@/src/types/video";
import { Player, PlayerRef } from "@remotion/player";
import { useEffect, useState } from "react";
import { preloadAudio, preloadImage, preloadVideo } from "@remotion/preload";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReviewFloating } from "@/src/components/ReviewFloating";

export default function VideoPreview({ playerRef, video, isMobile, showWatermark, hasExistingReview }: { playerRef: React.RefObject<PlayerRef>, video: IVideo | null, isMobile: boolean, showWatermark: boolean, hasExistingReview: boolean }) {
    const t = useTranslations('edit');
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [hasInteractedWithReview, setHasInteractedWithReview] = useState(false);

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

        if (video.video.transitions) {
            video.video.transitions.forEach(transition => {
                preloadVideo(transition.video);
                if (transition.sound) {
                    preloadAudio(transition.sound);
                }
            });
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

    useEffect(() => {
        const { current } = playerRef;
        if (!current) return;

        const playListener = () => {
            setHasStartedPlaying(true);
        };

        const pauseListener = () => {
            if (hasStartedPlaying && !hasInteractedWithReview && !hasExistingReview) {
                setShowReview(true);
            }
        };

        current.addEventListener('play', playListener);
        current.addEventListener('pause', pauseListener);

        return () => {
            current.removeEventListener('play', playListener);
            current.removeEventListener('pause', pauseListener);
        };
    }, [playerRef, hasStartedPlaying, hasInteractedWithReview, hasExistingReview]);

    const handleCloseReview = () => {
        setShowReview(false);
        setHasInteractedWithReview(true);
    };

    return (
        <div className={`h-full flex flex-col items-center justify-center ${!isMobile ? 'p-4' : ''}`}>
            {video?.video?.avatar && (
                <div className="text-xs sm:text-sm mb-2 sm:mb-0 w-full rounded-lg border bg-muted text-muted-foreground px-4 py-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('lip-sync-export-message')}
                </div>
            )}
            <div className="relative w-full h-full">
                <Player
                    acknowledgeRemotionLicense={true}
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
                    numberOfSharedAudioTags={12}
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
                    autoPlay={false}
                    renderLoading={() => null}
                />
            </div>
            {showReview && video?.id && !hasExistingReview && (
                <ReviewFloating
                    videoId={video.id}
                    onClose={handleCloseReview}
                />
            )}
        </div>
    )
}