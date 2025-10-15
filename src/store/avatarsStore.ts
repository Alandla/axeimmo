import { create } from 'zustand'
import { basicApiGetCall } from '../lib/api'
import { Avatar } from '../types/avatar'

// Registre de polling au niveau du module pour éviter toute interaction avec l'état zustand
const pollingBySpace = new Map<string, NodeJS.Timeout>();

interface AvatarsStoreState {
  avatarsBySpace: Map<string, Avatar[]>
  setAvatars: (spaceId: string, avatars: Avatar[]) => void
  getCachedAvatars: (spaceId: string) => Avatar[] | null
  fetchAvatars: (spaceId: string, forceRefresh?: boolean) => Promise<Avatar[]>
  fetchAvatarsInBackground: (spaceId: string) => Promise<Avatar[]>
  startPolling: (spaceId: string) => void
  stopPolling: (spaceId: string) => void
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

  startPolling: (spaceId: string) => {
    // Éviter les doublons
    if (pollingBySpace.get(spaceId)) {
      console.log(`[Polling] Already polling for space ${spaceId}`)
      return
    }

    const checkAndPoll = async () => {
      try {
        const avatars = get().avatarsBySpace.get(spaceId) || []
        
        // Vérifier s'il y a des looks en attente
        const hasPendingOrMissing = avatars.some(
          (a) => a.looks.some((l) => l.status === 'pending' || !l.thumbnail || l.thumbnail === "")
        )

        if (!hasPendingOrMissing) {
          // Tout est prêt, arrêter le polling
          console.log(`[Polling] All looks ready for space ${spaceId}, stopping polling`)
          get().stopPolling(spaceId)
          return
        }

        // Rafraîchir les avatars
        const latest = await get().fetchAvatarsInBackground(spaceId)
        
        // Vérifier à nouveau après le refresh
        const stillPending = latest.some(
          (a) => a.looks.some((l) => l.status === 'pending' || !l.thumbnail || l.thumbnail === "")
        )
        
        if (!stillPending) {
          console.log(`[Polling] All looks ready for space ${spaceId} after refresh, stopping polling`)
          get().stopPolling(spaceId)
        }
      } catch (e) {
        console.error(`[Polling] Error during polling for space ${spaceId}:`, e)
        // Arrêter en cas d'erreur pour éviter les boucles infinies
        get().stopPolling(spaceId)
      }
    }

    console.log(`[Polling] Starting fallback polling for space ${spaceId}`)
    const intervalId = setInterval(checkAndPoll, 3000) // Toutes les 10 secondes
    pollingBySpace.set(spaceId, intervalId)
  },

  stopPolling: (spaceId: string) => {
    const intervalId = pollingBySpace.get(spaceId)
    if (intervalId) {
      console.log(`[Polling] Stopping polling for space ${spaceId}`)
      clearInterval(intervalId)
      pollingBySpace.delete(spaceId)
    }
  },

  clearSpaceCache: (spaceId: string) => {
    // Arrêter le polling avant de nettoyer
    get().stopPolling(spaceId)
    
    set(state => {
      const newMap = new Map(state.avatarsBySpace)
      newMap.delete(spaceId)
      return { avatarsBySpace: newMap }
    })
  }
}))


