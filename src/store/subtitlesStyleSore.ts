import { create } from 'zustand'
import { ISpaceSubtitleStyle } from '../types/space'

type SubtitleStyleStore = {
  subtitleStyles: ISpaceSubtitleStyle[] | null
  setSubtitleStyles: (subtitleStyles: ISpaceSubtitleStyle[]) => void
}

export const useSubtitleStyleStore = create<SubtitleStyleStore>((set) => ({
  subtitleStyles: null,
  setSubtitleStyles: (subtitleStyles) => set({ subtitleStyles }),
}))

