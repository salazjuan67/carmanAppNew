export type VehicleState =
  | 'INGRESADO'
  | 'ESTACIONADO'
  | 'SOLICITADO'
  | 'EN LA PUERTA'
  | 'EN CAMINO'
  | 'ENTREGADO'
  | 'FACTURADO'

export interface Vehicle {
  _id: string;
  patente: string;
  sector: string;
  establecimiento: Establishment;
  nroLlave?: number;
  marca?: Brand | null;
  modelo?: string;
  color?: string;
  nombreConductor?: string;
  telefono?: string;
  quienSeLleva?: string;
  vip?: boolean;
  recurrente?: boolean;
  inhabilitado?: boolean;
  horaIngreso: string;
  horaEgreso?: string;
  estado: VehicleState;
  createdAt?: string;
  updatedAt?: string;
  historialEstados?: Estado[];
  ord?: number;
  nroTicket?: number;
  empleado?: string;
  turno?: string;
  active?: boolean;
  __v?: number;
  // Campos para tarjeta física (opcional)
  physicalCardId?: string;
  physicalCardNumber?: string;
  qrCode?: string;
  noPhysicalCard?: boolean; // Indica que no se lleva tarjeta física
}

export interface Establishment {
  _id: string;
  ord?: number;
  nombre: string;
  valets?: number;
  servicio?: string;
  direccion?: string;
  created_at?: string;
  active?: boolean;
  __v?: number;
  gerente?: string;
  poliza?: string;
  polizaVencimiento?: string;
  sectores?: Sector[];
  telefonoGerente?: string;
  tipoEstablecimiento?: number;
}

export interface Sector {
  nombre: string;
  capacidad: string;
  _id: string;
}

export interface Estado {
  estado: string;
  fecha: string;
  empleado: string;
  observacion: string;
  _id: string;
}

export interface Brand {
  _id: string;
  descripcion: string;
  activo: boolean;
}

export interface VehicleFound {
  _id: string;
  patente: string;
  marca?: string | Brand;
  modelo?: string;
  color?: string;
  nombreConductor?: string;
  telefono?: string;
  quienSeLleva?: string;
  vip?: boolean;
  recurrente?: boolean;
  inhabilitado?: boolean;
  establecimiento: string;
}

export interface VehicleFormData {
  patente: string;
  sector: string;
  establecimiento: string;
  nroLlave?: number;
  marca?: string;
  modelo?: string;
  color?: string;
  nombreConductor?: string;
  telefono?: string;
  quienSeLleva?: string;
  vip?: boolean;
  recurrente?: boolean;
  inhabilitado?: boolean;
  // Campos para tarjeta física (opcional)
  physicalCardId?: string;
  physicalCardNumber?: string;
  qrCode?: string;
  noPhysicalCard?: boolean;
}

export interface UpdateVehicleState {
  ingresoId: string;
  estado: VehicleState;
  horaEgreso?: string;
  patente?: string;
  establecimiento?: string;
  estadoAnterior?: VehicleState;
}

/** Respuesta POST /vehiculos/ingresos/estado (backend desplegado). */
export interface ChangeEstadoResponse {
  success: boolean;
  ingreso?: Vehicle;
  message?: string;
}

export interface VehicleStats {
  total: number;
  ingresados: number;
  estacionados: number;
  solicitados: number;
  enCamino: number;
  entregados: number;
  facturados: number;
  vip: number;
  recurrentes: number;
  inhabilitados: number;
}

import { z } from 'zod';

// Esquemas de validación Zod — obligatorios: patente, sector y establecimiento (este último viene del contexto)
export const VehicleFormScheme = z.object({
  patente: z
    .string()
    .min(1, 'La patente es requerida')
    .regex(/[a-zA-Z]{3}[0-9]{3}$|[a-zA-Z]{2}[0-9]{3}[a-zA-Z]{2}$/, 'Patente incorrecta'),
  sector: z.string().min(1, 'El sector es requerido'),
  establecimiento: z.string().min(1),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  color: z.string().optional(),
  nombreConductor: z.string().optional(),
  telefono: z.string().optional(),
  quienSeLleva: z.string().optional(),
});

export type VehicleFormDataZod = z.infer<typeof VehicleFormScheme>;

export type VehicleDataWithTime = VehicleFormDataZod & { 
  horaIngreso: string; 
};

// Regex para validación de patente argentina
export const PATENTE_REGEX = /^[a-zA-Z]{3}[0-9]{3}$|^[a-zA-Z]{2}[0-9]{3}[a-zA-Z]{2}$|^[a-zA-Z]{2}[0-9]{3}[a-zA-Z]{3}$/;

// Tipos para tarjetas físicas
export interface PhysicalCard {
  _id: string;
  cardNumber: string; // Ejemplo: "CM101", "CM102", etc.
  qrCode: string; // ID único del QR
  isActive: boolean;
  isAssigned: boolean;
  assignedVehicleId?: string;
  assignedAt?: string;
  establishmentId: string;
  establishmentCode: string; // Código del establecimiento (ej: "M" para Malloys)
  createdAt: string;
  updatedAt?: string;
}

// Respuesta del servicio de asignación de tarjeta
export interface CardAssignmentResponse {
  assignedCard: PhysicalCard;
  message: string;
}

/** Filtros opcionales para GET /vehiculos/ingresos (solo enviar si tienen valor) */
export interface IngresosListFilters {
  empleado?: string;
  patente?: string;
  marca?: string;
  created_at?: string;
  nroTicket?: string;
}
