import { create } from 'zustand';
import type { Asset, AssetFilters, AssetStatus } from '@/types';
import { mockAssets } from '@/mock/data';

interface AssetState {
  assets: Asset[];
  filters: AssetFilters;
  selectedAssetIds: string[];
  isInitialized: boolean;
  initializeData: () => void;
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

const STORAGE_KEY = 'asset_disposal_assets_v1';

function loadFromStorage(): Asset[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Asset[];
    }
  } catch {
    // ignore
  }
  return null;
}

function saveToStorage(assets: Asset[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
  } catch {
    // ignore
  }
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  filters: { ...defaultFilters },
  selectedAssetIds: [],
  isInitialized: false,

  initializeData: () => {
    if (get().isInitialized) return;
    const storedAssets = loadFromStorage();
    const baseAssets = storedAssets || mockAssets;
    set({
      assets: baseAssets,
      isInitialized: true,
    });
    if (!storedAssets) {
      saveToStorage(baseAssets);
    }
  },

  setAssets: (assets) => {
    set({ assets });
    saveToStorage(assets);
  },
  addAsset: (asset) =>
    set((state) => {
      const newAssets = [...state.assets, asset];
      saveToStorage(newAssets);
      return { assets: newAssets };
    }),
  updateAsset: (id, data) =>
    set((state) => {
      const newAssets = state.assets.map((a) =>
        a.id === id ? { ...a, ...data } : a
      );
      saveToStorage(newAssets);
      return { assets: newAssets };
    }),
  deleteAsset: (id) =>
    set((state) => {
      const newAssets = state.assets.filter((a) => a.id !== id);
      const newSelectedIds = state.selectedAssetIds.filter((sid) => sid !== id);
      saveToStorage(newAssets);
      return { assets: newAssets, selectedAssetIds: newSelectedIds };
    }),
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
    set((state) => {
      const newAssets = state.assets.map((a) =>
        ids.includes(a.id) ? { ...a, status } : a
      );
      saveToStorage(newAssets);
      return { assets: newAssets };
    }),
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
