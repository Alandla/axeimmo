import { create } from 'zustand';

interface CachedFrame {
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
}

interface VideoFramesStore {
  frames: Map<string, CachedFrame>;
  getFrame: (key: string) => CachedFrame | undefined;
  setFrame: (key: string, dataUrl: string, width: number, height: number) => void;
  clearCache: () => void;
  clearOldFrames: (maxAge?: number) => void;
}

// Générer une clé unique pour chaque combinaison vidéo/timestamp
export const generateFrameKey = (srcVideo: string, startAt: number) => {
  return `${srcVideo}#${startAt}`;
};

export const useVideoFramesStore = create<VideoFramesStore>((set, get) => ({
  frames: new Map<string, CachedFrame>(),

  getFrame: (key: string) => {
    const frames = get().frames;
    return frames.get(key);
  },

  setFrame: (key: string, dataUrl: string, width: number, height: number) => {
    set((state) => {
      const newFrames = new Map(state.frames);
      newFrames.set(key, {
        dataUrl,
        timestamp: Date.now(),
        width,
        height
      });
      
      // Nettoyer le cache si il devient trop gros (plus de 50 frames)
      if (newFrames.size > 50) {
        const sortedEntries = Array.from(newFrames.entries())
          .sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        // Garder seulement les 30 plus récentes
        const recentEntries = sortedEntries.slice(-30);
        const cleanedFrames = new Map(recentEntries);
        
        return { frames: cleanedFrames };
      }
      
      return { frames: newFrames };
    });
  },

  clearCache: () => {
    set({ frames: new Map() });
  },

  clearOldFrames: (maxAge = 30 * 60 * 1000) => { // 30 minutes par défaut
    set((state) => {
      const now = Date.now();
      const newFrames = new Map(state.frames);
      
      Array.from(newFrames.entries()).forEach(([key, frame]) => {
        if (now - frame.timestamp > maxAge) {
          newFrames.delete(key);
        }
      });
      
      return { frames: newFrames };
    });
  },
})); 