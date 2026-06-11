import { create } from 'zustand';
import type { Valuation, ValuationMethod, ValuationStatus } from '@/types';
import { mockValuations } from '@/mock/data';

interface ValuationState {
  valuations: Valuation[];
  isInitialized: boolean;
  initializeData: () => void;
  setValuations: (valuations: Valuation[]) => void;
  addValuation: (valuation: Valuation) => void;
  updateValuation: (id: string, data: Partial<Valuation>) => void;
  deleteValuation: (id: string) => void;
  getValuationById: (id: string) => Valuation | undefined;
  getValuationsByAssetId: (assetId: string) => Valuation[];
  getValuationsByApplicationId: (applicationId: string) => Valuation[];
}

export const useValuationStore = create<ValuationState>((set, get) => ({
  valuations: [],
  isInitialized: false,

  initializeData: () => {
    if (get().isInitialized) return;
    set({
      valuations: mockValuations,
      isInitialized: true,
    });
  },

  setValuations: (valuations) => set({ valuations }),

  addValuation: (valuation) =>
    set((state) => ({ valuations: [valuation, ...state.valuations] })),

  updateValuation: (id, data) =>
    set((state) => ({
      valuations: state.valuations.map((v) =>
        v.id === id ? { ...v, ...data } : v
      ),
    })),

  deleteValuation: (id) =>
    set((state) => ({
      valuations: state.valuations.filter((v) => v.id !== id),
    })),

  getValuationById: (id) => get().valuations.find((v) => v.id === id),

  getValuationsByAssetId: (assetId) =>
    get().valuations.filter((v) => v.assetId === assetId),

  getValuationsByApplicationId: (applicationId) =>
    get().valuations.filter((v) => v.applicationId === applicationId),
}));
