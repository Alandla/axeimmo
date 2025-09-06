import { create } from 'zustand'
import { CreationStep } from '../types/enums'
import { Voice } from '../types/voice'
import { AvatarLook } from '../types/avatar'
import { FileOrAssetToUpload } from '../types/files'
import { Step, Steps } from '../types/step'
import { KlingGenerationMode } from '../lib/fal'
import { IMedia, VideoFormat } from '../types/video'

type CreationStore = {
  script: string
  files: FileOrAssetToUpload[]
  totalCost: number
  creationStep: CreationStep
  selectedLook: AvatarLook | null
  selectedAvatarName: String | null
  selectedVoice: Voice | null
  steps: Step[]
  lastStep: Steps | null
  isWebMode: boolean
  extractedImagesMedia: IMedia[]
  animateImages: boolean
  animationMode: KlingGenerationMode
  emotionEnhancement: boolean
  videoFormat: VideoFormat
  setScript: (script: string) => void
  setFiles: (files: FileOrAssetToUpload[]) => void,
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
  setExtractedImagesMedia: (media: IMedia[]) => void
  addExtractedImagesMedia: (media: IMedia[]) => void
  setAnimateImages: (animate: boolean) => void
  setAnimationMode: (mode: KlingGenerationMode) => void
  setEmotionEnhancement: (enabled: boolean) => void
  setVideoFormat: (format: VideoFormat) => void
  reset: () => void
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
  extractedImagesMedia: [],
  animateImages: false,
  animationMode: KlingGenerationMode.STANDARD,
  emotionEnhancement: false,
  videoFormat: 'vertical',
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
  setExtractedImagesMedia: (media) => set({ extractedImagesMedia: media }),
  addExtractedImagesMedia: (media) => set((state) => ({ extractedImagesMedia: [...state.extractedImagesMedia, ...media] })),
  setAnimateImages: (animate) => set({ animateImages: animate }),
  setAnimationMode: (mode) => set({ animationMode: mode }),
  setEmotionEnhancement: (enabled) => set({ emotionEnhancement: enabled }),
  setVideoFormat: (format) => set({ videoFormat: format }),
  reset: () => set({
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
    extractedImagesMedia: [],
    animateImages: false,
    animationMode: KlingGenerationMode.STANDARD,
  }),
}))

