import { create } from 'zustand'
import { AvatarLook } from '../types/avatar'

interface LookToDeleteState {
  look: AvatarLook | null
  setLook: (look: AvatarLook | null) => void
}

export const useLookToDeleteStore = create<LookToDeleteState>((set) => ({
  look: null,
  setLook: (look) => set({ look }),
}))
