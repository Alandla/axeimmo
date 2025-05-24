import { create } from 'zustand'
import { CreationStep } from '../types/enums'
import { Voice } from '../types/voice'
import { AvatarLook } from '../types/avatar'
import { FileToUpload } from '../types/files'
import { Step, Steps } from '../types/step'

type CreationStore = {
  script: string
  files: FileToUpload[]
  totalCost: number
  creationStep: CreationStep
  selectedLook: AvatarLook | null
  selectedAvatarName: String | null
  selectedVoice: Voice | null
  steps: Step[]
  lastStep: Steps | null
  isWebMode: boolean
  setScript: (script: string) => void
  setFiles: (files: FileToUpload[]) => void,
  setTotalCost: (cost: number) => void
  addToTotalCost: (cost: number) => void
  setCreationStep: (step: CreationStep) => void
  setSelectedVoice: (voice: Voice | null) => void
  setSelectedAvatarName: (id: String | null) => void
  setSelectedLook: (avatar: AvatarLook | null) => void
  addStep: (step: Step) => void
  setSteps: (steps: Step[]) => void
  setLastStep: (step: Steps) => void
  resetSteps: () => void
  setWebMode: (isEnabled: boolean) => void
}

export const useCreationStore = create<CreationStore>((set) => ({
  script: '',
  files: [],
  totalCost: 0,
  creationStep: CreationStep.START,
  selectedVoice: null,
  selectedLook: null,
  selectedAvatarName: null,
  steps: [],
  lastStep: null,
  isWebMode: false,
  setScript: (script) => set({ script }),
  setFiles: (files) => set({ files }),
  setTotalCost: (cost) => set({ totalCost: cost }),
  addToTotalCost: (cost) => set((state) => ({ totalCost: state.totalCost + cost })),
  setCreationStep: (step) => set({ creationStep: step }),
  setSelectedVoice: (voice) => set({ selectedVoice: voice }),
  setSelectedLook: (avatar) => set({ selectedLook: avatar }),
  setSelectedAvatarName: (name) => set({ selectedAvatarName: name }),
  addStep: (step) => set((state) => ({ steps: [...state.steps, step] })),
  setSteps: (steps) => set({ steps }),
  setLastStep: (step) => set({ lastStep: step }),
  resetSteps: () => set({ steps: [], lastStep: null }),
  setWebMode: (isEnabled) => set({ isWebMode: isEnabled }),
}))

