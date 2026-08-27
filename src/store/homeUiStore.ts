import { create } from 'zustand';

interface HomeUiState {
  /** Tras abrir una notificación de solicitud: al enfocar home, mostrar pestaña Solicitados. */
  solicitadosTabPending: boolean;
  requestSolicitadosTabOnHome: () => void;
  consumeSolicitadosTabRequest: () => boolean;
}

export const useHomeUiStore = create<HomeUiState>((set, get) => ({
  solicitadosTabPending: false,
  requestSolicitadosTabOnHome: () => set({ solicitadosTabPending: true }),
  consumeSolicitadosTabRequest: () => {
    if (get().solicitadosTabPending) {
      set({ solicitadosTabPending: false });
      return true;
    }
    return false;
  },
}));
