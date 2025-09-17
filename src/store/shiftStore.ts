import { create } from 'zustand';
import { Shift } from '../types/shift';

type ShiftStore = {
  shift: Shift | null;
  setShift: (shift: Shift | null) => void;
};

export const useShiftStore = create<ShiftStore>((set) => ({
  shift: null,
  setShift: (shift) => set({ shift }),
}));
