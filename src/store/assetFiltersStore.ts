import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GenericFilter } from '@/src/components/ui/generic-filters'
import { AssetFilterType } from '@/src/types/filters'

interface AssetFiltersState {
  filters: GenericFilter<AssetFilterType>[]
  setFilters: (filters: GenericFilter<AssetFilterType>[]) => void
  clearFilters: () => void
  updateFilter: (filterId: string, updates: Partial<GenericFilter<AssetFilterType>>) => void
  removeFilter: (filterId: string) => void
}

export const useAssetFiltersStore = create<AssetFiltersState>()(
  persist(
    (set, get) => ({
      filters: [],
      
      setFilters: (filters) => set({ filters }),
      
      clearFilters: () => set({ filters: [] }),
      
      updateFilter: (filterId, updates) => set((state) => ({
        filters: state.filters.map(filter => 
          filter.id === filterId ? { ...filter, ...updates } : filter
        )
      })),
      
      removeFilter: (filterId) => set((state) => ({
        filters: state.filters.filter(filter => filter.id !== filterId)
      })),
    }),
    {
      name: 'asset-filters-storage',
      version: 1,
    }
  )
) 