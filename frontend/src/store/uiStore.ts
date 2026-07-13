import { create } from 'zustand';

interface UiState {
  filterDrawerOpen: boolean;
  setFilterDrawerOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  filterDrawerOpen: false,
  setFilterDrawerOpen: (open) => set({ filterDrawerOpen: open }),
}));
