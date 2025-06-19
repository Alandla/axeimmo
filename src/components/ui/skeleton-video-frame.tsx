import { useState, useEffect, useRef } from 'react';
import { extractFrames } from '@remotion/webcodecs';
import { useVideoFramesStore, generateFrameKey } from '@/src/store/videoFramesStore';

interface SkeletonVideoFrameProps {
  srcVideo: string;
  className: string;
  startAt?: number;
  alt?: string;
}

const SkeletonVideoFrame = ({ 
  srcVideo,
  className, 
  startAt = 0,
  alt = ""
}: SkeletonVideoFrameProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getFrame, setFrame } = useVideoFramesStore();

  useEffect(() => {
    const frameKey = generateFrameKey(srcVideo, startAt);
    const cachedFrame = getFrame(frameKey);

    // Si la frame est dans le cache, l'utiliser directement
    if (cachedFrame && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = cachedFrame.width;
        canvas.height = cachedFrame.height;
        
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          setIsLoading(false);
        };
        img.src = cachedFrame.dataUrl;
      }
      return;
    }

    // Sinon, extraire la frame et la mettre en cache
    const extractFrame = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await extractFrames({
          src: srcVideo,
          timestampsInSeconds: [startAt],
          onFrame: (frame) => {
            if (canvasRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              
              if (ctx) {
                // Set canvas dimensions to match the video frame
                canvas.width = frame.displayWidth;
                canvas.height = frame.displayHeight;
                
                // Draw the frame to the canvas
                ctx.drawImage(frame, 0, 0);
                
                // Convertir le canvas en data URL et le mettre en cache
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                setFrame(frameKey, dataUrl, frame.displayWidth, frame.displayHeight);
                
                // Clean up the frame
                frame.close();
                
                setIsLoading(false);
              }
            }
          },
          acknowledgeRemotionLicense: true,
        });
      } catch (err) {
        console.error('Error extracting frame:', err);
        setError('Failed to extract frame');
        setIsLoading(false);
      }
    };

    if (srcVideo) {
      extractFrame();
    }
  }, [srcVideo, startAt, getFrame, setFrame]);

  if (error) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <span className="text-gray-500 text-sm">Failed to load frame</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {/* Canvas to display the extracted frame */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-cover rounded-md ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-200`}
        style={{ display: isLoading ? 'none' : 'block' }}
      />
    </div>
  );
};

export default SkeletonVideoFrame; 