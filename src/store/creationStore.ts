import { create } from 'zustand'
import { CreationStep } from '../types/enums'
import { Voice } from '../types/voice'
import { UploadedFile } from '../components/ai-chat-tab'

type CreationStore = {
  script: string
  files: UploadedFile[]
  totalCost: number
  creationStep: CreationStep
  selectedAvatar: string | null
  selectedVoice: Voice | null
  setScript: (script: string) => void
  setFiles: (files: UploadedFile[]) => void,
  setTotalCost: (cost: number) => void
  addToTotalCost: (cost: number) => void
  setCreationStep: (step: CreationStep) => void
  setSelectedVoice: (voice: Voice | null) => void
  setSelectedAvatar: (avatar: string | null) => void
}

export const useCreationStore = create<CreationStore>((set) => ({
  script: '',
  files: [],
  totalCost: 0,
  creationStep: CreationStep.START,
  selectedVoice: null,
  selectedAvatar: null,
  setScript: (script) => set({ script }),
  setFiles: (files) => set({ files }),
  setTotalCost: (cost) => set({ totalCost: cost }),
  addToTotalCost: (cost) => set((state) => ({ totalCost: state.totalCost + cost })),
  setCreationStep: (step) => set({ creationStep: step }),
  setSelectedVoice: (voice) => set({ selectedVoice: voice }),
  setSelectedAvatar: (avatar) => set({ selectedAvatar: avatar }),
}))

