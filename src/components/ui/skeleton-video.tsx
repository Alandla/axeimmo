import { useState, useRef } from 'react';

const SkeletonVideo = ({ srcImg, srcVideo, alt, className }: { srcImg: string, srcVideo: string, alt: string, className: string }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false); // Add video loaded state
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    setIsHovering(true);
    setVideoLoaded(false); // Reset video loaded state
    if (videoRef.current) {
      videoRef.current.load(); // Load the video
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setVideoLoaded(false); // Reset video loaded state
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const onVideoLoadedData = () => {
    setVideoLoaded(true); // Set video loaded state to true when video data is loaded
    if (videoRef.current) {
      videoRef.current.play(); // Play the video after it's loaded
    }
  };

  return (
    <div
      className={`relative overflow-hidden ${className} ${!loaded ? 'bg-gray-200 animate-pulse' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isHovering && srcVideo && (
        <video
          ref={videoRef}
          loop 
          muted 
          className={`w-auto h-full absolute inset-0 object-contain ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoadedData={onVideoLoadedData}>
            <source src={srcVideo} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
      )}
        <img
          src={srcImg}
          alt={alt}
          className={`w-auto h-full object-contain transition-opacity duration-300 ${!videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
        />
    </div>
  );
};

export default SkeletonVideo;
