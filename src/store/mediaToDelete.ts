import { create } from 'zustand'
import { IMedia } from '../types/video'

type MediaToDeleteStore = {
  media: IMedia | null
  spaceId: string | null
  setMedia: (media: IMedia) => void
  setSpaceId: (spaceId: string) => void
}

export const useMediaToDeleteStore = create<MediaToDeleteStore>((set) => ({
  media: null,
  spaceId: null,
  setMedia: (media) => set({ media }),
  setSpaceId: (spaceId) => set({ spaceId }),
}))

