import { create } from 'zustand'// Assurez-vous de définir le type User
import { basicApiCall } from '@/src/lib/api'
import { IUser } from '../types/user'

interface UsersStore {
  users: Map<string, IUser>
  fetchUser: (userId: string) => Promise<IUser>
}

export const useUsersStore = create<UsersStore>((set, get) => ({
  users: new Map(),
  fetchUser: async (userId: string) => {
    const existingUser = get().users.get(userId)
    if (existingUser) return existingUser

    const user: IUser = await basicApiCall('/user/getByIdForVideo', { userId })
    set((state) => {
      const newUsers = new Map(state.users)
      newUsers.set(userId, user)
      return { users: newUsers }
    })
    return user
  },
}))