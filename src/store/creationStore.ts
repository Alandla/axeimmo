import { create } from 'zustand'
import { CreationStep } from '../types/enums'
import { Voice } from '../types/voice'

type CreationStore = {
  script: string
  totalCost: number
  creationStep: CreationStep
  selectedAvatar: string | null
  selectedVoice: Voice | null
  setScript: (script: string) => void
  setTotalCost: (cost: number) => void
  addToTotalCost: (cost: number) => void
  setCreationStep: (step: CreationStep) => void
  setSelectedVoice: (voice: Voice | null) => void
  setSelectedAvatar: (avatar: string | null) => void
}

export const useCreationStore = create<CreationStore>((set) => ({
  script: '',
  totalCost: 0,
  creationStep: CreationStep.START,
  selectedVoice: null,
  selectedAvatar: null,
  setScript: (script) => set({ script }),
  setTotalCost: (cost) => set({ totalCost: cost }),
  addToTotalCost: (cost) => set((state) => ({ totalCost: state.totalCost + cost })),
  setCreationStep: (step) => set({ creationStep: step }),
  setSelectedVoice: (voice) => set({ selectedVoice: voice }),
  setSelectedAvatar: (avatar) => set({ selectedAvatar: avatar }),
}))

