import { create } from 'zustand';
import type { Asset, AssetFilters, AssetStatus } from '@/types';

interface AssetState {
  assets: Asset[];
  filters: AssetFilters;
  selectedAssetIds: string[];
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, data: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  getAssetById: (id: string) => Asset | undefined;
  setFilters: (filters: Partial<AssetFilters>) => void;
  resetFilters: () => void;
  setSelectedAssetIds: (ids: string[]) => void;
  toggleSelectedAsset: (id: string) => void;
  clearSelectedAssets: () => void;
  batchUpdateStatus: (ids: string[], status: AssetStatus) => void;
  filteredAssets: () => Asset[];
}

const defaultFilters: AssetFilters = {
  keyword: '',
  category: '',
  status: '',
  department: '',
  dateRange: null,
};

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  filters: { ...defaultFilters },
  selectedAssetIds: [],
  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((state) => ({ assets: [...state.assets, asset] })),
  updateAsset: (id, data) =>
    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? { ...a, ...data } : a)),
    })),
  deleteAsset: (id) =>
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
      selectedAssetIds: state.selectedAssetIds.filter((sid) => sid !== id),
    })),
  getAssetById: (id) => get().assets.find((a) => a.id === id),
  setFilters: (filters) =>
    set((state) => ({ filters: { ...state.filters, ...filters } })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),
  setSelectedAssetIds: (ids) => set({ selectedAssetIds: ids }),
  toggleSelectedAsset: (id) =>
    set((state) => ({
      selectedAssetIds: state.selectedAssetIds.includes(id)
        ? state.selectedAssetIds.filter((sid) => sid !== id)
        : [...state.selectedAssetIds, id],
    })),
  clearSelectedAssets: () => set({ selectedAssetIds: [] }),
  batchUpdateStatus: (ids, status) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        ids.includes(a.id) ? { ...a, status } : a
      ),
    })),
  filteredAssets: () => {
    const { assets, filters } = get();
    return assets.filter((asset) => {
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        if (
          !asset.name.toLowerCase().includes(kw) &&
          !asset.assetNo.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      if (filters.category && asset.category !== filters.category) {
        return false;
      }
      if (filters.status && asset.status !== filters.status) {
        return false;
      }
      if (filters.department && asset.department !== filters.department) {
        return false;
      }
      if (filters.dateRange) {
        const [start, end] = filters.dateRange;
        const purchaseDate = new Date(asset.purchaseDate).getTime();
        if (start && purchaseDate < new Date(start).getTime()) {
          return false;
        }
        if (end && purchaseDate > new Date(end).getTime()) {
          return false;
        }
      }
      return true;
    });
  },
}));
