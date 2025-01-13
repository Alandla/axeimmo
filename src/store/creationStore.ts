import { create } from 'zustand'
import { CreationStep } from '../types/enums'
import { Voice } from '../types/voice'
import { AvatarLook } from '../types/avatar'
import { FileToUpload } from '../types/files'
import { Step } from '../types/step'

type CreationStore = {
  script: string
  files: FileToUpload[]
  totalCost: number
  creationStep: CreationStep
  selectedLook: AvatarLook | null
  selectedAvatarName: String | null
  selectedVoice: Voice | null
  steps: Step[]
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
  resetSteps: () => void
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
  resetSteps: () => set({ steps: [] })
}))

