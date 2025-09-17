export type ShiftState = 'MAÑANA' | 'MEDIODIA' | 'TARDE' | 'NOCHE' | 'MADRUGADA'

export interface Shift {
  _id: string;
  turno: ShiftState;
  establecimiento: string;
  nombre: string;
  createdAt: string;
  createdBy: {
    _id: string;
    username: string;
    email: string;
  };
  __v: number;
}

export interface NewShiftBody {
  establecimiento: string;
  turno: ShiftState;
  nombre: string;
}

export interface NewShiftResponse {
  _id: string;
  nombre: string;
  establecimiento: string;
  turno: ShiftState;
  createdAt: string;
}

export interface EndShiftResponse {
  _id: string;
  nombre: string;
  establecimiento: string;
  turno: ShiftState;
  createdAt: string;
}

export const SHIFT_OPTIONS = [
  { value: 'MAÑANA', label: 'Mañana' },
  { value: 'MEDIODIA', label: 'Mediodía' },
  { value: 'TARDE', label: 'Tarde' },
  { value: 'NOCHE', label: 'Noche' },
  { value: 'MADRUGADA', label: 'Madrugada' },
] as const;
