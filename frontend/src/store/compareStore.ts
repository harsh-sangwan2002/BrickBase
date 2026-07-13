import { create } from 'zustand';

interface CompareState {
  ids: number[];
  toggle: (id: number) => void;
  clear: () => void;
  isSelected: (id: number) => boolean;
}

const MAX_COMPARE = 4;

export const useCompareStore = create<CompareState>((set, get) => ({
  ids: [],
  toggle: (id) =>
    set((state) => {
      if (state.ids.includes(id)) {
        return { ids: state.ids.filter((i) => i !== id) };
      }
      if (state.ids.length >= MAX_COMPARE) return state;
      return { ids: [...state.ids, id] };
    }),
  clear: () => set({ ids: [] }),
  isSelected: (id) => get().ids.includes(id),
}));
