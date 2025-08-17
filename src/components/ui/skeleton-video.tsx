import { useState, useRef } from 'react';
import Image from 'next/image';

const SkeletonVideo = ({ 
  srcVideo,
  className, 
  disableHoverPlay = false,
  startAt = 0,
  thumbnailImage,
  fallbackThumbnail
}: { 
  srcVideo: string, 
  className: string,
  disableHoverPlay?: boolean,
  startAt?: number,
  thumbnailImage?: string,
  fallbackThumbnail?: string
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(!thumbnailImage && !fallbackThumbnail);
  const [thumbnailError, setThumbnailError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoLoaded = () => {
    setIsVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.currentTime = startAt;
      videoRef.current.pause();
      
      // Si l'utilisateur est en train de hover quand la vidéo se charge, la lancer immédiatement
      if (isHovering && !disableHoverPlay) {
        videoRef.current.play();
      }
    }
  };

  const currentThumbnail = thumbnailImage && !thumbnailError ? thumbnailImage : fallbackThumbnail;

  const handleMouseEnter = () => {
    if (disableHoverPlay) return;
    
    setIsHovering(true);
    
    // Commencer à charger la vidéo si ce n'est pas déjà fait
    if (!shouldLoadVideo) {
      setShouldLoadVideo(true);
    }
    
    // Si la vidéo est chargée, la jouer
    if (videoRef.current && isVideoLoaded) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (disableHoverPlay) return;
    
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = startAt;
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${className} bg-gray-200`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image de vignette (priorité) */}
      {currentThumbnail && (
        <div 
          className={` ${
            isHovering && isVideoLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Image
            src={currentThumbnail}
            alt=""
            width={800}
            height={450}
            className="w-full h-auto object-cover rounded-md"
            unoptimized={
              currentThumbnail &&
              !currentThumbnail.includes('pexels.com') ||
              !currentThumbnail.includes('media.hoox.video')
            }
            onError={() => setThumbnailError(true)}
          />
        </div>
      )}

      {/* Vidéo (chargée seulement au hover ou si pas d'image) */}
      {shouldLoadVideo && (
        <div className={`${currentThumbnail ? 'absolute inset-0' : 'relative'} w-full h-full`}>
          <video
            key={`${srcVideo}-${startAt}`} // Force remount quand srcVideo ou startAt change
            ref={videoRef}
            muted
            playsInline
            loop={isHovering && !disableHoverPlay}
            preload="metadata"
            poster={currentThumbnail}
            className={`w-full h-full object-cover rounded-md ${
              currentThumbnail 
                ? (isHovering && isVideoLoaded ? 'opacity-100' : 'opacity-0') 
                : (isVideoLoaded ? 'opacity-100' : 'opacity-0')
            }`}
            onLoadedData={handleVideoLoaded}
            disablePictureInPicture
            disableRemotePlayback
          >
            <source src={srcVideo} type="video/mp4" />
          </video>
        </div>
      )}

      {/* Skeleton loader si aucune image et vidéo pas encore chargée */}
      {!currentThumbnail && !isVideoLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};

export default SkeletonVideo;
