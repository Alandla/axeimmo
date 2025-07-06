import { create } from 'zustand'
import { ILastUsed, ISpace, SimpleSpace } from '../types/space'

type ActiveSpaceStore = {
  activeSpace: SimpleSpace | null
  lastUsedParameters: ILastUsed | null
  setActiveSpace: (space: SimpleSpace) => void
  setActiveSpaceFromISpace: (space: ISpace) => void
  setLastUsedParameters: (space: ILastUsed) => void
  decrementCredits: (amount: number) => void
  incrementImageToVideoUsage: () => void
}

export const useActiveSpaceStore = create<ActiveSpaceStore>((set) => ({
  activeSpace: null,
  lastUsedParameters: null,
  setActiveSpace: (space) => set({ activeSpace: space }),
  setActiveSpaceFromISpace: (space) => set({
    activeSpace: {
      id: space.id,
      name: space.name,
      planName: space.plan.name,
      creditsPerMonth: space.plan.creditsMonth,
      credits: space.credits,
      videoIdeas: space.videoIdeas,
      companyMission: space.details?.companyMission,
      companyTarget: space.details?.companyTarget,
      usedStorageBytes: space.usedStorageBytes,
      storageLimit: space.plan.storageLimit,
      imageToVideoLimit: space.plan.imageToVideoLimit,
      imageToVideoUsed: space.imageToVideoUsed,
    }
  }),
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

