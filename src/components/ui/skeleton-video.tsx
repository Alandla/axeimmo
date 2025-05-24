import { useState, useRef } from 'react';
import Image from 'next/image';

const SkeletonVideo = ({ 
  srcVideo,
  className, 
  disableHoverPlay = false,
  startAt = 0,
  thumbnailImage
}: { 
  srcVideo: string, 
  className: string,
  disableHoverPlay?: boolean,
  startAt?: number,
  thumbnailImage?: string
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(!thumbnailImage);
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
      {thumbnailImage && (
        <div 
          className={`transition-opacity duration-200 ${
            isHovering && isVideoLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Image
            src={thumbnailImage}
            alt=""
            width={800}
            height={450}
            className="w-full h-auto object-cover rounded-md"
            unoptimized={thumbnailImage.includes('pexels.com')}
          />
        </div>
      )}

      {/* Vidéo (chargée seulement au hover ou si pas d'image) */}
      {shouldLoadVideo && (
        <div className={`${thumbnailImage ? 'absolute inset-0' : 'relative'} w-full h-full`}>
          <video
            key={`${srcVideo}-${startAt}`} // Force remount quand srcVideo ou startAt change
            ref={videoRef}
            muted
            playsInline
            loop={isHovering && !disableHoverPlay}
            preload="metadata"
            className={`w-full h-full object-cover rounded-md ${
              thumbnailImage 
                ? (isHovering && isVideoLoaded ? 'opacity-100' : 'opacity-0') 
                : (isVideoLoaded ? 'opacity-100' : 'opacity-0')
            } transition-opacity duration-200`}
            onLoadedData={handleVideoLoaded}
            disablePictureInPicture
            disableRemotePlayback
          >
            <source src={srcVideo} type="video/mp4" />
          </video>
        </div>
      )}

      {/* Skeleton loader si aucune image et vidéo pas encore chargée */}
      {!thumbnailImage && !isVideoLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
};

export default SkeletonVideo;
