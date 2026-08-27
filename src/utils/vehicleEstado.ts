import { QueryClient } from '@tanstack/react-query';
import { Vehicle } from '../types/vehicle';

/** Debe coincidir exactamente con el backend (mayúsculas, espacio). */
export const ESTADO_EN_LA_PUERTA = 'EN LA PUERTA' as const;

export const ESTADOS_SOLICITADOS = [
  'SOLICITADO',
  'EN CAMINO',
  ESTADO_EN_LA_PUERTA,
] as const;

export const ESTADOS_INGRESOS = ['INGRESADO', 'ESTACIONADO'] as const;
export const ESTADOS_EGRESOS = ['ENTREGADO', 'FACTURADO'] as const;

/** Normaliza `estado` del API para comparar con constantes en mayúsculas. */
export const normalizeEstado = (estado: string | undefined): string => {
  if (!estado) return '';
  const upper = estado.trim().replace(/\s+/g, ' ').toUpperCase();
  if (upper === 'EN PUERTA') return ESTADO_EN_LA_PUERTA;
  return upper;
};

export const isIngresosEstado = (estado: string | undefined): boolean => {
  const n = normalizeEstado(estado);
  return (ESTADOS_INGRESOS as readonly string[]).includes(n);
};

export const isSolicitadosEstado = (estado: string | undefined): boolean => {
  const n = normalizeEstado(estado);
  return (ESTADOS_SOLICITADOS as readonly string[]).includes(n);
};

export const isEgresosEstado = (estado: string | undefined): boolean => {
  const n = normalizeEstado(estado);
  return (ESTADOS_EGRESOS as readonly string[]).includes(n);
};

/** Mensaje legible para errores del POST /vehiculos/ingresos/estado (p. ej. 400 Estado inválido). */
export const parseVehicleStateChangeError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'No se pudo cambiar el estado del vehículo';
  }

  const message = error.message;

  if (/\b400\b/.test(message)) {
    const jsonStart = message.indexOf('{');
    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(message.slice(jsonStart)) as { message?: string };
        if (parsed.message?.trim()) return parsed.message.trim();
      } catch {
        // ignore
      }
    }
    return 'Estado inválido';
  }

  if (message.includes('Estado inválido')) {
    return 'Estado inválido';
  }

  return message || 'No se pudo cambiar el estado del vehículo';
};

/** Aplica `ingreso` devuelto por el backend en las queries de detalle y listado. */
export const mergeIngresoInQueryCache = (queryClient: QueryClient, raw: Vehicle): void => {
  const id = raw._id ?? (raw as Vehicle & { id?: string }).id;
  if (!id) return;

  const ingreso: Vehicle = {
    ...raw,
    _id: String(id),
    estado: (normalizeEstado(raw.estado) || raw.estado) as Vehicle['estado'],
  };

  queryClient.setQueryData<Vehicle>(['vehicle', ingreso._id], ingreso);

  queryClient.setQueriesData<Vehicle[]>({ queryKey: ['vehicles'] }, (old) => {
    if (!old?.length) return old;
    const idx = old.findIndex((v) => v._id === ingreso._id);
    if (idx >= 0) {
      return old.map((v, i) => (i === idx ? ingreso : v));
    }
    return [...old, ingreso];
  });
};
