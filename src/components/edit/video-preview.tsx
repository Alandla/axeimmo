import { VideoGenerate } from "@/src/remotion/generateVideo/Composition";
import { IVideo, VideoFormat } from "@/src/types/video";
import { getVideoDimensions } from "@/src/types/video";
import { Player, PlayerRef } from "@remotion/player";
import { useEffect, useState } from "react";
import { preloadAudio, preloadImage, preloadVideo } from "@remotion/preload";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReviewFloating } from "@/src/components/ReviewFloating";
import VideoFormatSelector from "@/src/components/edit/video-format-selector";
import AvatarSelector from "@/src/components/edit/avatar-selector";
import { AvatarSelectionModal } from "@/src/components/modal/avatar-selection-modal";
import { AvatarLook } from "@/src/types/avatar";
import { useActiveSpaceStore } from "@/src/store/activeSpaceStore";
import { LogoPosition } from "@/src/types/space";
import { LogoPositionSelector } from "@/src/components/ui/logo-position-selector";

export default function VideoPreview({ 
    playerRef, 
    video, 
    isMobile, 
    showWatermark, 
    hasExistingReview, 
    onSubtitleStyleChange,
    onAvatarHeightRatioChange,
    onAvatarPositionChange,
    onMediaPositionChange,
    onVideoFormatChange,
    onAvatarChange,
    onLogoPositionChange,
    onLogoSizeChange
}: { 
    playerRef: React.RefObject<PlayerRef>, 
    video: IVideo | null, 
    isMobile: boolean, 
    showWatermark: boolean, 
    hasExistingReview: boolean, 
    onSubtitleStyleChange?: (newStyle: any) => void,
    onAvatarHeightRatioChange?: (ratio: number) => void,
    onAvatarPositionChange?: (position: { x: number, y: number }) => void,
    onMediaPositionChange?: (sequenceId: number, position: { x: number, y: number }) => void,
    onVideoFormatChange?: (format: VideoFormat) => void,
    onAvatarChange?: (avatar: AvatarLook | null) => void,
    onLogoPositionChange?: (position: LogoPosition) => void,
    onLogoSizeChange?: (size: number) => void
}) {
    const t = useTranslations('edit');
    const { activeSpace } = useActiveSpaceStore();
    const [hasStartedPlaying, setHasStartedPlaying] = useState(false);
    const [showReview, setShowReview] = useState(false);
    const [hasInteractedWithReview, setHasInteractedWithReview] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [showLogoSelector, setShowLogoSelector] = useState(false);
    const [logoPositionChanged, setLogoPositionChanged] = useState(false);

    // Get video dimensions based on format
    const dimensions = getVideoDimensions(video?.video?.format || 'vertical');

    // Récupérer les données du logo depuis activeSpace
    const logoData = activeSpace?.logo ? {
        url: activeSpace.logo.url,
        position: activeSpace.logo.position,
        show: activeSpace.logo.show,
        size: activeSpace.logo.size
    } : undefined;

    // Clé unique pour forcer la mise à jour du player quand la position du logo change via le sélecteur
    const playerKey = logoPositionChanged ? `player-${activeSpace?.logo?.position?.x}-${activeSpace?.logo?.position?.y}-${activeSpace?.logo?.size}-${Date.now()}` : 'player-default';

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

    const handleLogoClick = () => {
        setShowLogoSelector(true);
    };

    const handleLogoPositionChange = (newPosition: LogoPosition) => {
        if (onLogoPositionChange) {
            onLogoPositionChange(newPosition);
        }
        setShowLogoSelector(false);
        setLogoPositionChanged(true);
    };

    // Réinitialiser logoPositionChanged après la mise à jour du player
    useEffect(() => {
        if (logoPositionChanged) {
            const timer = setTimeout(() => {
                setLogoPositionChanged(false);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [logoPositionChanged]);

    return (
        <div className={`h-full flex flex-col items-center justify-center ${!isMobile ? 'p-4' : ''}`}>
            {video?.video?.avatar && (
                <div className="text-xs sm:text-sm mb-2 sm:mb-4 w-full rounded-lg border bg-muted text-muted-foreground px-4 py-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t('lip-sync-export-message')}
                </div>
            )}
            {video?.video && onVideoFormatChange && (
                <div className="w-full mb-4">
                    <div className={`grid gap-2 ${video.video.avatar && onAvatarChange ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        <VideoFormatSelector
                            value={video.video.format || 'vertical'}
                            onValueChange={onVideoFormatChange}
                        />
                        {video.video.avatar && onAvatarChange && (
                            <AvatarSelector
                                selectedAvatar={video.video.avatar}
                                onAvatarSelect={() => setShowAvatarModal(true)}
                            />
                        )}
                    </div>
                </div>
            )}
            
            {/* Logo Position Selector */}
            {showLogoSelector && activeSpace?.logo?.position && (
                <div className="w-full mb-4 p-4 bg-background border rounded-lg shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium">Position du logo</h3>
                        <button
                            onClick={() => setShowLogoSelector(false)}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            ✕
                        </button>
                    </div>
                    <LogoPositionSelector
                        value={activeSpace.logo.position}
                        onChange={handleLogoPositionChange}
                        isSquare={true}
                        predefinedOnly={true}
                    />
                </div>
            )}
            
            <div className="relative w-full h-full transition-all duration-300 ease-in-out">
                <Player
                    key={playerKey}
                    acknowledgeRemotionLicense={true}
                    ref={playerRef}
                    component={VideoGenerate}
                    durationInFrames={video?.video?.metadata.audio_duration ? Math.ceil(video?.video?.metadata.audio_duration * 60) : 1}
                    fps={60}
                    compositionWidth={dimensions.width}
                    compositionHeight={dimensions.height}
                    inputProps={{
                        data: video,
                        showWatermark,
                        logo: logoData,
                        onSubtitleStyleChange,
                        onAvatarHeightRatioChange,
                        onAvatarPositionChange,
                        onMediaPositionChange,
                        onLogoPositionChange,
                        onLogoSizeChange,
                        onLogoClick: handleLogoClick
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
                        transition: 'all 0.3s ease-in-out',
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
            
            {video?.video?.avatar && onAvatarChange && (
                <AvatarSelectionModal
                    isOpen={showAvatarModal}
                    onClose={() => setShowAvatarModal(false)}
                    currentAvatar={video.video.avatar}
                    onAvatarChange={onAvatarChange}
                />
            )}
        </div>
    )
}