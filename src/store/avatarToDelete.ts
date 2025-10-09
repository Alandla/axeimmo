import { create } from 'zustand'
import { Avatar } from '../types/avatar'

interface AvatarToDeleteState {
  avatar: Avatar | null
  setAvatar: (avatar: Avatar | null) => void
}

export const useAvatarToDeleteStore = create<AvatarToDeleteState>((set) => ({
  avatar: null,
  setAvatar: (avatar) => set({ avatar }),
}))
