import { VideoGenerate } from "@/src/remotion/generateVideo/Composition";
import { IVideo, VideoFormat } from "@/src/types/video";
import { getVideoDimensions } from "@/src/types/video";
import { Player, PlayerRef } from "@remotion/player";
import { useEffect, useState } from "react";
import { preloadAudio, preloadImage, preloadVideo } from "@remotion/preload";
import { AlertCircle, ImagePlay, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReviewFloating } from "@/src/components/ReviewFloating";
import VideoFormatSelector from "@/src/components/edit/video-format-selector";
import AvatarSelector from "@/src/components/edit/avatar-selector";
import { AvatarSelectionModal } from "@/src/components/modal/avatar-selection-modal";
import { AvatarLook } from "@/src/types/avatar";
import { LogoPosition } from "@/src/types/space";
import { Button } from "@/src/components/ui/button";
import { ElementsSelectionModal } from "@/src/components/modal/elements-selection-modal";
import { IMedia, IElement } from "@/src/types/video";

export default function VideoPreview({ 
    playerRef, 
    video, 
    isMobile, 
    showWatermark, 
    hasExistingReview, 
    muteBackgroundMusic,
    onSubtitleStyleChange,
    onAvatarHeightRatioChange,
    onAvatarPositionChange,
    onMediaPositionChange,
    onVideoFormatChange,
    onAvatarChange,
    onLogoPositionChange,
    onLogoSizeChange,
    logoData,
    spaceId,
    onElementSelect,
    onElementPositionChange,
    onElementSizeChange,
    onElementRotationChange,
    onElementStartChange,
    onElementEndChange,
    onElementMediaChange,
    onElementDelete,
    elementToReplaceIndex,
    onElementReplaceSelect
}: { 
    playerRef: React.RefObject<PlayerRef>, 
    video: IVideo | null, 
    isMobile: boolean, 
    showWatermark: boolean, 
    hasExistingReview: boolean, 
    muteBackgroundMusic?: boolean,
    onSubtitleStyleChange?: (newStyle: any) => void,
    onAvatarHeightRatioChange?: (ratio: number) => void,
    onAvatarPositionChange?: (position: { x: number, y: number }) => void,
    onMediaPositionChange?: (sequenceId: number, position: { x: number, y: number }) => void,
    onVideoFormatChange?: (format: VideoFormat) => void,
    onAvatarChange?: (avatar: AvatarLook | null) => void,
    onLogoPositionChange?: (position: LogoPosition) => void,
    onLogoSizeChange?: (size: number) => void,
    logoData?: {
        url: string;
        position: LogoPosition;
        show: boolean;
        size: number;
    },
    spaceId?: string,
    onElementSelect?: (media: IMedia) => void,
    onElementPositionChange?: (index: number, position: { x: number, y: number }) => void,
    onElementSizeChange?: (index: number, size: number) => void,
    onElementRotationChange?: (index: number, rotation: number) => void,
    onElementStartChange?: (index: number, start: number) => void,
    onElementEndChange?: (index: number, end: number) => void,
    onElementMediaChange?: (index: number) => void,
    onElementDelete?: (index: number) => void,
    elementToReplaceIndex?: number | null,
    onElementReplaceSelect?: (media: IMedia) => void
}) {
    const t = useTranslations('edit');
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [hasInteractedWithReview, setHasInteractedWithReview] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showElementsModal, setShowElementsModal] = useState(false);
    // Removed floating LogoPositionSelector here; it is now shown above the logo inside the canvas

    // Get video dimensions based on format
    const dimensions = getVideoDimensions(video?.video?.format || 'vertical');

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

    // Click on logo is now handled inside the canvas to open the floating selector

    const handleLogoPositionChange = (newPosition: LogoPosition) => {
        if (onLogoPositionChange) {
            onLogoPositionChange(newPosition);
        }
    };

    const handleElementMediaChangeLocal = (index: number) => {
        // Pour le changement de média, on appelle le handler parent puis on ouvre le modal
        onElementMediaChange?.(index);
        setShowElementsModal(true);
    };

    const handlePlayPause = () => {
        const player = playerRef.current;
        if (!player) return;
        
        if (player.isPlaying()) {
            player.pause();
        } else {
            player.play();
        }
    };

    return (
        <div className={`h-full flex flex-col items-center justify-center ${!isMobile ? 'p-4' : ''}`}>
            {video?.video?.avatar && (
                <div className="text-xs sm:text-sm mb-2 sm:mb-4 w-full rounded-lg border bg-muted text-muted-foreground px-4 py-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('lip-sync-export-message')}
                </div>
            )}
            {video?.video && (onVideoFormatChange || spaceId) && (
                <div className="w-full mb-4">
                    <div className={`grid gap-2 ${spaceId ? (onAvatarChange ? 'grid-cols-3' : 'grid-cols-2') : (onAvatarChange ? 'grid-cols-2' : 'grid-cols-1')}`}>
                        {spaceId && (
                            <Button
                                variant="outline"
                                onClick={() => setShowElementsModal(true)}
                                className="w-full"
                            >
                                <ImagePlay className="h-4 w-4" />
                                {t('add-elements')}
                            </Button>
                        )}
                        {onVideoFormatChange && (
                            <VideoFormatSelector
                                value={video.video.format || 'vertical'}
                                onValueChange={onVideoFormatChange}
                            />
                        )}
                        {onAvatarChange && (
                            <AvatarSelector
                                selectedAvatar={video.video.avatar || null}
                                onAvatarSelect={() => setShowAvatarModal(true)}
                            />
                        )}
                    </div>
                </div>
            )}
            

            <div className="relative w-full h-full">
                <div 
                    className="rounded-lg transition-all duration-300 ease-in-out"
                    style={{
                        aspectRatio: `${dimensions.width} / ${dimensions.height}`,
                        width: '100%',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        maxHeight: '100%',
                        maxWidth: '100%',
                    }}
                >
                    <Player
                        acknowledgeRemotionLicense={true}
                        ref={playerRef}
                        component={VideoGenerate}
                        durationInFrames={video?.video?.metadata.audio_duration ? Math.ceil(video?.video?.metadata.audio_duration * 60) : 1}
                        fps={60}
                        compositionWidth={dimensions.width}
                        compositionHeight={dimensions.height}
                        overflowVisible
                        inputProps={{
                            data: video,
                            showWatermark,
                            logo: logoData,
                            muteBackgroundMusic,
                            onSubtitleStyleChange,
                            onAvatarHeightRatioChange,
                            onAvatarPositionChange,
                            onMediaPositionChange,
                            onLogoPositionChange,
                            onLogoSizeChange,
                            onElementPositionChange: onElementPositionChange,
                            onElementSizeChange: onElementSizeChange,
                            onElementRotationChange: onElementRotationChange,
                            onElementStartChange: onElementStartChange,
                            onElementEndChange: onElementEndChange,
                            onElementMediaChange: handleElementMediaChangeLocal,
                            onElementDelete: onElementDelete,
                            onPlayPause: handlePlayPause,
                        }}
                        numberOfSharedAudioTags={12}
                        controls
                        clickToPlay={false}
                        style={{
                            width: '100%',
                            height: '100%',
                            transition: 'all 0.3s ease-in-out',
                        }}
                        autoPlay={false}
                        renderLoading={() => null}
                    />
                </div>
            </div>
            {showReview && video?.id && !hasExistingReview && (
                <ReviewFloating
                    videoId={video.id}
                    onClose={handleCloseReview}
                />
            )}
            
            {onAvatarChange && (
                <AvatarSelectionModal
                    isOpen={showAvatarModal}
                    onClose={() => setShowAvatarModal(false)}
                    currentAvatar={video?.video?.avatar || null}
                    onAvatarChange={onAvatarChange}
                />
            )}
            
            {spaceId && (
                <ElementsSelectionModal
                    isOpen={showElementsModal}
                    onClose={() => setShowElementsModal(false)}
                    spaceId={spaceId}
                    onElementSelect={elementToReplaceIndex !== null ? (onElementReplaceSelect || (() => {})) : (onElementSelect || (() => {}))}
                />
            )}
        </div>
    )
}