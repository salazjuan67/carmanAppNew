import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, User, Establishment, AppError } from '../types';

interface AppStore extends AppState {
  // Actions
  setUser: (user: User | null) => void;
  setEstablishment: (establishment: Establishment | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setLanguage: (language: string) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  clearError: () => void;
  logout: () => void;
  reset: () => void;
}

const initialState: AppState = {
  user: null,
  establishment: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  language: 'es',
  theme: 'dark',
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      
      setEstablishment: (establishment) => set({ establishment }),
      
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),
      
      setLanguage: (language) => set({ language }),
      
      setTheme: (theme) => set({ theme }),
      
      clearError: () => set({ error: null }),
      
      logout: () => set({
        user: null,
        establishment: null,
        isAuthenticated: false,
        error: null,
      }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'carman-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        establishment: state.establishment,
        isAuthenticated: state.isAuthenticated,
        language: state.language,
        theme: state.theme,
      }),
    }
  )
);
