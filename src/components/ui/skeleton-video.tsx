import { useState, useRef, useEffect } from 'react';

const SkeletonVideo = ({ 
  srcVideo,
  className, 
  disableHoverPlay = false,
  startAt = 0
}: { 
  srcVideo: string, 
  className: string,
  disableHoverPlay?: boolean,
  startAt?: number
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Charger la vidéo dès le début et la positionner au timestamp spécifié
  useEffect(() => {
    if (videoRef.current && srcVideo) {
      videoRef.current.load();
      setIsLoaded(false);
    }
  }, [srcVideo, startAt]);

  const handleVideoLoaded = () => {
    setIsLoaded(true);
    if (videoRef.current) {
      videoRef.current.currentTime = startAt; // Positionner au timestamp spécifié
      videoRef.current.pause();
    }
  };

  const handleMouseEnter = () => {
    if (disableHoverPlay) return;
    
    setIsHovering(true);
    if (videoRef.current && isLoaded) {
      videoRef.current.play();
    }
  };

  const handleMouseLeave = () => {
    if (disableHoverPlay) return;
    
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = startAt; // Revenir au timestamp spécifié
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${className} bg-gray-200 ${!isLoaded ? 'animate-pulse' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Conteneur de la vidéo */}
      <div className="relative w-full h-full">
        {/* Vidéo unique qui sert à la fois de vignette et de lecteur */}
        <video
          ref={videoRef}
          muted
          playsInline
          loop={isHovering && !disableHoverPlay}
          preload="metadata"
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
          onLoadedData={handleVideoLoaded}
          crossOrigin="anonymous"
          disablePictureInPicture
          disableRemotePlayback
        >
          <source src={srcVideo} type="video/mp4" />
        </video>
      </div>
    </div>
  );
};

export default SkeletonVideo;
