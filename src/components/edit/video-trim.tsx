import { useState, useEffect, useRef } from 'react';
import { IMedia, ISequence } from "@/src/types/video";
import { parseMedia } from '@remotion/media-parser';
import { useMediaCacheStore } from '@/src/store/mediaCacheStore';
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  const { addToCache, getFromCache } = useMediaCacheStore();
  const mediaUrl = sequence.media?.video?.link || '';
  const cachedMedia = getFromCache(mediaUrl);
  const [videoDurationInSeconds, setVideoDurationInSeconds] = useState<number | null>(cachedMedia?.durationInSeconds || null);
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>(cachedMedia?.thumbnails || []);
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false);
  
  const startAtInSeconds = sequence.media?.startAt !== undefined ? sequence.media.startAt : 0;

  // Framer Motion values
  const x = useMotionValue(0);
  const width = useMotionValue(0);

  // Update position when startAtInSeconds changes
  useEffect(() => {
    if (containerRef.current && videoDurationInSeconds) {
      const containerWidth = containerRef.current.offsetWidth;
      const newPosition = (startAtInSeconds / videoDurationInSeconds) * containerWidth;
      animate(x, newPosition, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [startAtInSeconds, videoDurationInSeconds, containerRef.current?.offsetWidth]);

  // Update width when sequence duration changes
  useEffect(() => {
    if (containerRef.current && videoDurationInSeconds) {
      const containerWidth = containerRef.current.offsetWidth;
      const sequenceDuration = sequence.durationInFrames ? sequence.durationInFrames / 60 : 0;
      const newWidth = (sequenceDuration / videoDurationInSeconds) * containerWidth;
      animate(width, newWidth, { type: "spring", stiffness: 300, damping: 30 });
    }
  }, [sequence.durationInFrames, videoDurationInSeconds, containerRef.current?.offsetWidth]);

  // Transform x position to left overlay width
  const leftOverlayWidth = useTransform(x, (value) => `${value}px`);
  
  // Transform x and width to right overlay width
  const rightOverlayWidth = useTransform(
    [x, width],
    (latest: number[]) => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      return `calc(100% - ${latest[0] + latest[1]}px)`;
    }
  );

  const handleDragEnd = () => {
    if (!containerRef.current || !videoDurationInSeconds) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const currentTime = (x.get() / containerWidth) * videoDurationInSeconds;

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
    let newStartAt = currentTime;
    if (nearestMarker) {
      newStartAt = nearestMarker.start;
      const newPosition = (newStartAt / videoDurationInSeconds) * containerWidth;
      animate(x, newPosition, { type: "spring", stiffness: 300, damping: 30 });
    }
    
    const updatedMedia = { 
      ...sequence.media, 
      startAt: Math.round(newStartAt * 10) / 10
    } as IMedia;
    
    setSequenceMedia(sequenceIndex, updatedMedia);
    setIsDragging(false);
  };

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
          acknowledgeRemotionLicense: true,
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
        className="relative w-full h-16 rounded overflow-hidden"
      >
        <div className="absolute inset-0 flex z-0 overflow-hidden bg-muted">
          {isGeneratingThumbnails || thumbnails.length === 0 ? (
            <div className="w-full h-full flex items-center justify-around px-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-1 bg-muted-foreground/30 rounded-full"
                  style={{ height: `${i % 2 === 0 ? 30 : 60}%` }}
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

        <motion.div 
          className="absolute top-0 left-0 h-full bg-black/50 z-10"
          style={{ width: leftOverlayWidth }}
        />

        <motion.div 
          className="absolute top-0 right-0 h-full bg-black/50 z-10"
          style={{ width: rightOverlayWidth }}
        />
        
        <motion.div
          ref={sliderRef}
          drag="x"
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={containerRef}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          style={{ x, width }}
          className="absolute top-0 h-full z-20 cursor-grab active:cursor-grabbing before:content-[''] before:absolute before:inset-0 before:border-t-2 before:border-b-2 before:border-white"
        >
          <motion.div 
            className="absolute left-0 top-1/2 translate-x-[-100%] -translate-y-1/2 w-4 h-full bg-white rounded-tl-md rounded-bl-md rounded-br-none rounded-tr-none flex items-center justify-center"
          >
            <div className="h-6 w-px bg-gray-700 rounded-full" />
          </motion.div>
          
          <motion.div 
            className="absolute right-0 top-1/2 translate-x-[100%] -translate-y-1/2 w-4 h-full bg-white rounded-tl-none rounded-bl-none rounded-br-md rounded-tr-md flex items-center justify-center"
          >
            <div className="h-6 w-px bg-gray-700 rounded-full" />
          </motion.div>
        </motion.div>

        {/* Marqueurs des moments clés */}
        {sequence.media?.description?.map((desc, index) => {
          if (!videoDurationInSeconds || desc.start === 0) return null;
          const markerPosition = (desc.start / videoDurationInSeconds) * (containerRef.current?.offsetWidth || 0);
          return (
            <div
              key={index}
              className="absolute top-0 w-px h-full bg-yellow-400/50 z-10"
              style={{ left: `${markerPosition}px` }}
            />
          );
        })}
      </div>
    </div>
  );
} 