import { create } from 'zustand';

interface AppState {
  // UI State uniquement
  sidebarOpen: boolean;
  currentView: string;
  
  // Actions UI
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // UI State
  sidebarOpen: true,
  currentView: 'dashboard',
  
  // Actions
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),
}));
