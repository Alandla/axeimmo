import { create } from 'zustand'
import { ILastUsed, SimpleSpace } from '../types/space'

type ActiveSpaceStore = {
  activeSpace: SimpleSpace | null
  lastUsedParameters: ILastUsed | null
  setActiveSpace: (space: SimpleSpace) => void
  setLastUsedParameters: (space: ILastUsed) => void
  decrementCredits: (amount: number) => void
  incrementImageToVideoUsage: () => void
}

export const useActiveSpaceStore = create<ActiveSpaceStore>((set) => ({
  activeSpace: null,
  lastUsedParameters: null,
  setActiveSpace: (space) => set({ activeSpace: space }),
  setLastUsedParameters: (lastUsedParameters) => set({ lastUsedParameters }),
  decrementCredits: (amount) => set((state) => ({
    activeSpace: state.activeSpace ? {
      ...state.activeSpace,
      credits: Math.max(0, state.activeSpace.credits - amount)
    } : null
  })),
  incrementImageToVideoUsage: () => set((state) => ({
    activeSpace: state.activeSpace ? {
      ...state.activeSpace,
      imageToVideoUsed: (state.activeSpace.imageToVideoUsed || 0) + 1
    } : null
  }))
}))

