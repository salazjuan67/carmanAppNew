export type VehicleState =
  | 'INGRESADO'
  | 'ESTACIONADO'
  | 'SOLICITADO'
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
}

export interface UpdateVehicleState {
  ingresoId: string;
  estado: VehicleState;
  horaEgreso?: string;
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
