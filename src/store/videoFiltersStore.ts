import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GenericFilter } from '@/src/components/ui/generic-filters'
import { VideoFilterType } from '@/src/types/filters'

interface VideoFiltersStore {
  filters: GenericFilter<VideoFilterType>[]
  setFilters: (filters: GenericFilter<VideoFilterType>[]) => void
  addFilter: (filter: GenericFilter<VideoFilterType>) => void
  updateFilter: (id: string, updates: Partial<GenericFilter<VideoFilterType>>) => void
  removeFilter: (id: string) => void
  clearFilters: () => void
}

export const useVideoFiltersStore = create<VideoFiltersStore>()(
  persist(
    (set, get) => ({
      filters: [],
      setFilters: (filters) => set({ filters }),
      addFilter: (filter) => set((state) => ({ 
        filters: [...state.filters, filter] 
      })),
      updateFilter: (id, updates) => set((state) => ({
        filters: state.filters.map((filter) =>
          filter.id === id ? { ...filter, ...updates } : filter
        ),
      })),
      removeFilter: (id) => set((state) => ({
        filters: state.filters.filter((filter) => filter.id !== id),
      })),
      clearFilters: () => set({ filters: [] }),
    }),
    {
      name: 'video-filters-storage',
    }
  )
) 