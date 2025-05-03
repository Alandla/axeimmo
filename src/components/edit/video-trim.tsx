import { useState, useEffect, useRef } from 'react';
import { IMedia, ISequence } from "@/src/types/video";
import { parseMedia } from '@remotion/media-parser';
import { useMediaCacheStore } from '@/src/store/mediaCacheStore';

interface VideoTrimProps {
  sequence: ISequence;
  sequenceIndex: number;
  setSequenceMedia: (sequenceIndex: number, media: IMedia) => void;
}

interface Thumbnail {
  url: string;
  time: number;
}

export default function VideoTrim({ sequence, sequenceIndex, setSequenceMedia }: VideoTrimProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState(0);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const { addToCache, getFromCache } = useMediaCacheStore();
  const mediaUrl = sequence.media?.video?.link || '';
  const cachedMedia = getFromCache(mediaUrl);
  const [videoDurationInSeconds, setVideoDurationInSeconds] = useState<number | null>(cachedMedia?.durationInSeconds || null);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>(cachedMedia?.thumbnails || []);
  
  const startAtInSeconds = sequence.media?.startAt !== undefined ? sequence.media.startAt : 0;
  
  useEffect(() => {
    if (!sequence.media?.video?.link) return;
    
    if (cachedMedia) {
      setVideoDurationInSeconds(cachedMedia.durationInSeconds);
      setThumbnails(cachedMedia.thumbnails);
      return;
    }

    const videoUrl = sequence.media.video.link;
    
    const initializeVideo = async () => {
      try {
        // D'abord récupérer les métadonnées
        const metadata = await parseMedia({
          src: videoUrl,
          fields: {
            durationInSeconds: true,
            dimensions: true,
          },
        });

        const durationInSeconds = (metadata.durationInSeconds as number) || 0;
        setVideoDurationInSeconds(durationInSeconds);
        
        // Puis générer les miniatures avec la durée correcte
        if (durationInSeconds > 0) {
          await generateThumbnails(videoUrl, durationInSeconds);
        }
      } catch (error) {
        console.error('Error initializing video:', error);
        const estimatedSeconds = sequence.media?.video 
          ? ((sequence.media.video.size / 100000) * 60) / 100
          : 10;
        setVideoDurationInSeconds(estimatedSeconds);
        if (estimatedSeconds > 0) {
          await generateThumbnails(videoUrl, estimatedSeconds);
        }
      }
    };

    initializeVideo();
  }, [sequence.media?.video?.link]);

  const generateThumbnails = async (videoUrl: string, duration: number) => {
    if (cachedMedia?.thumbnails.length) return;
    
    setIsGeneratingThumbnails(true);
    
    try {
      const numThumbnails = Math.min(Math.max(5, Math.floor(duration / 2)), 10);
      const interval = duration / numThumbnails;
      
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
        video.load();
      });
      
      const newThumbnails: Thumbnail[] = [];
      
      for (let i = 0; i < numThumbnails; i++) {
        const time = i * interval;
        video.currentTime = time;
        
        const thumbUrl = await new Promise<string>((resolve) => {
          video.onseeked = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 160;
            canvas.height = video.videoHeight * (160 / video.videoWidth);
            
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.5));
          };
        });
        
        newThumbnails.push({ url: thumbUrl, time });
      }
      
      addToCache(videoUrl, duration, newThumbnails);
      setThumbnails(newThumbnails);
    } catch (error) {
      console.error('Error generating thumbnails:', error);
    } finally {
      setIsGeneratingThumbnails(false);
    }
  };

  useEffect(() => {
    if (containerRef.current && sliderRef.current && videoDurationInSeconds) {
      const containerWidth = containerRef.current.offsetWidth;
      const position = (startAtInSeconds / videoDurationInSeconds) * containerWidth;
      setStartPosition(position);
    }
  }, [startAtInSeconds, videoDurationInSeconds]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !sliderRef.current) return;
    updatePosition(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current || !sliderRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.touches.length > 0) {
      updatePosition(e.touches[0].clientX);
    }
  };

  const updatePosition = (clientX: number) => {
    if (!containerRef.current || !sliderRef.current || !videoDurationInSeconds) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const sliderWidth = sliderRef.current.offsetWidth;
    const maxX = containerRect.width - sliderWidth;
    
    let newPosition = clientX - containerRect.left - (sliderWidth / 2);
    newPosition = Math.max(0, Math.min(newPosition, maxX));

    // Calcul du temps actuel basé sur la position
    const currentTime = (newPosition / containerRect.width) * videoDurationInSeconds;
    
    // Vérifier si on est proche d'un marqueur (dans une marge de 0.3 secondes)
    const snapThreshold = 0.3; // secondes
    const nearestMarker = sequence.media?.description?.reduce((nearest, desc) => {
      const timeDiff = Math.abs(desc.start - currentTime);
      if (timeDiff < snapThreshold && (!nearest || timeDiff < Math.abs(nearest.start - currentTime))) {
        return desc;
      }
      return nearest;
    }, null as (typeof sequence.media.description)[0] | null);

    // Si on trouve un marqueur proche, on ajuste la position pour s'y aligner
    if (nearestMarker) {
      newPosition = (nearestMarker.start / videoDurationInSeconds) * containerRect.width;
    }
    
    setStartPosition(newPosition);
    
    const rawSeconds = (newPosition / containerRect.width) * videoDurationInSeconds;
    const newStartAt = Math.round(rawSeconds * 10) / 10;
    
    const updatedMedia = { 
      ...sequence.media, 
      startAt: newStartAt
    } as IMedia;
    
    setSequenceMedia(sequenceIndex, updatedMedia);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.addEventListener('touchend', handleTouchEnd);
      document.addEventListener('touchmove', handleTouchMove as unknown as EventListener, { passive: false });

      // Empêcher le scroll du body pendant le drag
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchMove as unknown as EventListener);

      // Réactiver le scroll
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchMove as unknown as EventListener);
      
      // S'assurer de réactiver le scroll au démontage
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging]);

  if (!sequence.media || sequence.media.type !== 'video') {
    return null;
  }

  const fps = sequence.media?.video?.fps || 60;
  const sequenceDurationInSeconds = sequence.durationInFrames
    ? sequence.durationInFrames / fps
    : 0;

  const totalSeconds = videoDurationInSeconds || 10;
  const sliderWidthPercentage = sequenceDurationInSeconds 
    ? (sequenceDurationInSeconds / totalSeconds) * 100 
    : 20;

  return (
    <div className="w-full mb-4 border rounded-md touch-none">
      <div 
        ref={containerRef}
        className={`relative w-full h-16 rounded overflow-hidden cursor-pointer ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <div className="absolute inset-0 flex z-0 overflow-hidden bg-muted">
          {isGeneratingThumbnails || thumbnails.length === 0 ? (
            <div className="w-full h-full flex items-center justify-around px-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-muted-foreground/30 rounded-full"
                  style={{ height: `${20 + Math.random() * 60}%` }}
                />
              ))}
            </div>
          ) : (
            thumbnails.map((thumb, index) => (
              <div 
                key={index} 
                className="flex-1 h-full"
                style={{ 
                  backgroundImage: `url(${thumb.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            ))
          )}
        </div>

        <div 
          className="absolute top-0 left-0 h-full bg-black/50 z-10"
          style={{ width: `${startPosition}px` }}
        />

        <div 
          className="absolute top-0 right-0 h-full bg-black/50 z-10"
          style={{ width: `calc(100% - ${startPosition + ((containerRef.current?.offsetWidth || 0) * (sliderWidthPercentage / 100))}px)` }}
        />
        
        <div
          ref={sliderRef}
          className="absolute top-0 h-full z-20 before:content-[''] before:absolute before:inset-0 before:border-t-4 before:border-b-4 before:border-white"
          style={{ 
            left: `${startPosition}px`,
            width: `${Math.min(sliderWidthPercentage, 100)}%`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {/* Marqueurs des moments clés */}
          {sequence.media?.description?.map((desc, index) => {
            const markerPosition = ((desc.start - startAtInSeconds) / sequenceDurationInSeconds) * 100;
            // Ne montrer que les marqueurs qui sont dans la plage visible et pas à 0
            if (markerPosition > 0 && markerPosition <= 100) {
              return (
                <div
                  key={index}
                  className="absolute top-0 w-px h-full bg-yellow-400/60"
                  style={{
                    left: `${markerPosition}%`,
                  }}
                />
              );
            }
            return null;
          })}

          <div className="absolute left-0 top-1/2 translate-x-[-100%] -translate-y-1/2 w-4 h-full bg-white rounded-tl-md rounded-bl-md rounded-br-none rounded-tr-none flex items-center justify-center">
            <div className="h-6 w-px bg-gray-700 rounded-full"></div>
          </div>
          
          <div className="absolute right-0 top-1/2 translate-x-[100%] -translate-y-1/2 w-4 h-full bg-white rounded-tl-none rounded-bl-none rounded-br-md rounded-tr-md flex items-center justify-center">
            <div className="h-6 w-px bg-gray-700 rounded-full"></div>
          </div>
        </div>

        {/* Marqueurs des moments clés en arrière-plan */}
        {sequence.media?.description?.map((desc, index) => {
          if (!videoDurationInSeconds) return null;
          if (desc.start === 0) return null; // Ne pas afficher le marqueur à 0
          const markerPosition = (desc.start / videoDurationInSeconds) * (containerRef.current?.offsetWidth || 0);
          return (
            <div
              key={`bg-${index}`}
              className="absolute top-0 w-px h-full bg-yellow-400/50 z-10"
              style={{
                left: `${markerPosition}px`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
} 