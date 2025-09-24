import { create } from 'zustand';
import { Establishment } from '../types/vehicle';

interface EstablishmentState {
  selectedEstablishment: Establishment | null;
  setSelectedEstablishment: (establishment: Establishment | null) => void;
}

export const useEstablishmentStore = create<EstablishmentState>((set) => ({
  selectedEstablishment: null,
  setSelectedEstablishment: (establishment) => set({ selectedEstablishment: establishment }),
}));
