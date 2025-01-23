import { create } from 'zustand'
import { ILastUsed, SimpleSpace } from '../types/space'

type ActiveSpaceStore = {
  activeSpace: SimpleSpace | null
  lastUsedParameters: ILastUsed | null
  setActiveSpace: (space: SimpleSpace) => void
  setLastUsedParameters: (space: ILastUsed) => void
}

export const useActiveSpaceStore = create<ActiveSpaceStore>((set) => ({
  activeSpace: null,
  lastUsedParameters: null,
  setActiveSpace: (space) => set({ activeSpace: space }),
  setLastUsedParameters: (lastUsedParameters) => set({ lastUsedParameters }),
}))

