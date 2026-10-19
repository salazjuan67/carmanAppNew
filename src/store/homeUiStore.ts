import { create } from 'zustand';

interface HomeUiState {
  /** Tras abrir una notificación de solicitud: al enfocar home, mostrar pestaña Solicitados. */
  solicitadosTabPending: boolean;
  /** Push recibida en foreground: refrescar lista de vehículos. */
  vehiclesRefreshPending: boolean;
  requestSolicitadosTabOnHome: () => void;
  consumeSolicitadosTabRequest: () => boolean;
  requestVehiclesRefresh: () => void;
  consumeVehiclesRefreshRequest: () => boolean;
}

export const useHomeUiStore = create<HomeUiState>((set, get) => ({
  solicitadosTabPending: false,
  vehiclesRefreshPending: false,
  requestSolicitadosTabOnHome: () => set({ solicitadosTabPending: true }),
  consumeSolicitadosTabRequest: () => {
    if (get().solicitadosTabPending) {
      set({ solicitadosTabPending: false });
      return true;
    }
    return false;
  },
  requestVehiclesRefresh: () => set({ vehiclesRefreshPending: true }),
  consumeVehiclesRefreshRequest: () => {
    if (get().vehiclesRefreshPending) {
      set({ vehiclesRefreshPending: false });
      return true;
    }
    return false;
  },
}));
