import { create } from 'zustand'
import { SimpleSpace } from '../types/space'

type ActiveSpaceStore = {
  activeSpace: SimpleSpace | null
  setActiveSpace: (space: SimpleSpace) => void
}

export const useActiveSpaceStore = create<ActiveSpaceStore>((set) => ({
  activeSpace: null,
  setActiveSpace: (space) => set({ activeSpace: space }),
}))

