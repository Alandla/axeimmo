import { create } from 'zustand'

interface Thumbnail {
  url: string
  time: number
}

interface MediaCache {
  durationInSeconds: number
  thumbnails: Thumbnail[]
}

interface MediaCacheStore {
  cache: Record<string, MediaCache>
  addToCache: (mediaUrl: string, durationInSeconds: number, thumbnails: Thumbnail[]) => void
  getFromCache: (mediaUrl: string) => MediaCache | undefined
}

export const useMediaCacheStore = create<MediaCacheStore>((set, get) => ({
  cache: {},
  
  addToCache: (mediaUrl, durationInSeconds, thumbnails) => {
    set((state) => ({
      cache: {
        ...state.cache,
        [mediaUrl]: {
          durationInSeconds,
          thumbnails
        }
      }
    }))
  },
  
  getFromCache: (mediaUrl) => {
    return get().cache[mediaUrl]
  }
})) 