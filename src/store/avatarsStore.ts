import { create } from 'zustand'
import { basicApiGetCall } from '../lib/api'
import { Avatar } from '../types/avatar'

// Registre SSE au niveau du module pour éviter toute interaction avec l'état zustand
const sseBySpace = new Map<string, EventSource>();

interface AvatarsStoreState {
  avatarsBySpace: Map<string, Avatar[]>
  setAvatars: (spaceId: string, avatars: Avatar[]) => void
  getCachedAvatars: (spaceId: string) => Avatar[] | null
  fetchAvatars: (spaceId: string, forceRefresh?: boolean) => Promise<Avatar[]>
  fetchAvatarsInBackground: (spaceId: string) => Promise<Avatar[]>
  startSse: (spaceId: string) => void
  stopSse: (spaceId: string) => void
  clearSpaceCache: (spaceId: string) => void
  // UI-scoped state for avatars
  activeAvatarName: string | null
  setActiveAvatarName: (name: string | null) => void
}

export const useAvatarsStore = create<AvatarsStoreState>((set, get) => ({
  avatarsBySpace: new Map(),
  activeAvatarName: null,
  setActiveAvatarName: (name) => set({ activeAvatarName: name }),

  setAvatars: (spaceId: string, avatars: Avatar[]) => {
    set(state => {
      const newMap = new Map(state.avatarsBySpace)
      newMap.set(spaceId, avatars)
      return { avatarsBySpace: newMap }
    })
  },

  getCachedAvatars: (spaceId: string) => {
    const state = get()
    return state.avatarsBySpace.get(spaceId) || null
  },

  fetchAvatars: async (spaceId: string, forceRefresh: boolean = false) => {
    const state = get()
    const cached = state.avatarsBySpace.get(spaceId)
    if (!forceRefresh && cached) return cached

    const raw = await basicApiGetCall<Avatar[] | { data: Avatar[] }>(`/space/${spaceId}/avatars`)
    const avatars = (raw as any)?.data ?? raw
    get().setAvatars(spaceId, (avatars as Avatar[]) || [])
    return (avatars as Avatar[]) || []
  },

  fetchAvatarsInBackground: async (spaceId: string) => {
    try {
      const raw = await basicApiGetCall<Avatar[] | { data: Avatar[] }>(`/space/${spaceId}/avatars`)
      const avatars = (raw as any)?.data ?? raw
      get().setAvatars(spaceId, (avatars as Avatar[]) || [])
      return (avatars as Avatar[]) || []
    } catch (e) {
      const state = get()
      return state.avatarsBySpace.get(spaceId) || []
    }
  },

  startSse: (spaceId: string) => {
    // Éviter les doublons
    if (sseBySpace.get(spaceId)) return
    try {
      const evtSrc = new EventSource(`/api/space/${spaceId}/avatars/stream`)
      evtSrc.onmessage = async (ev) => {
        try {
          const msg = JSON.parse(ev.data)
          if (msg?.type === 'look.updated' || msg?.type === 'avatar.updated') {
            await get().fetchAvatarsInBackground(spaceId)
          }
        } catch {}
      }
      evtSrc.onerror = () => {
        try { evtSrc.close() } catch {}
        sseBySpace.delete(spaceId)
      }
      sseBySpace.set(spaceId, evtSrc)
    } catch {}
  },

  stopSse: (spaceId: string) => {
    const src = sseBySpace.get(spaceId)
    if (src) {
      try { src.close() } catch {}
      sseBySpace.delete(spaceId)
    }
  },

  clearSpaceCache: (spaceId: string) => {
    set(state => {
      const newMap = new Map(state.avatarsBySpace)
      newMap.delete(spaceId)
      return { avatarsBySpace: newMap }
    })
  }
}))


