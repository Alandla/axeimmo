import { create } from 'zustand'
import { IVideo } from '../types/video'

type VideoToDeleteStore = {
  video: IVideo | null
  spaceId: string | null
  setVideo: (video: IVideo) => void
  setSpaceId: (spaceId: string) => void
}

export const useVideoToDeleteStore = create<VideoToDeleteStore>((set) => ({
  video: null,
  spaceId: null,
  setVideo: (video) => set({ video }),
  setSpaceId: (spaceId) => set({ spaceId }),
}))

