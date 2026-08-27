import { Vehicle } from '../types/vehicle';

const FALLBACK_TIMESTAMP = Number.POSITIVE_INFINITY;

const parseDateToTimestamp = (value?: string | null): number => {
  if (!value) {
    return FALLBACK_TIMESTAMP;
  }

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp) ? FALLBACK_TIMESTAMP : timestamp;
};

const getFirstStateTimestamp = (vehicle: Vehicle, states: string[]): number | undefined => {
  if (!vehicle.historialEstados?.length) {
    return undefined;
  }

  const sortedHistory = [...vehicle.historialEstados].sort(
    (a, b) => parseDateToTimestamp(a.fecha) - parseDateToTimestamp(b.fecha)
  );

  for (const estado of sortedHistory) {
    if (states.includes(estado.estado)) {
      const timestamp = parseDateToTimestamp(estado.fecha);

      if (Number.isFinite(timestamp)) {
        return timestamp;
      }
    }
  }

  return undefined;
};

export const getIngresoSortValue = (vehicle: Vehicle): number => {
  return parseDateToTimestamp(vehicle.createdAt || vehicle.horaIngreso);
};

export const getSolicitadoSortValue = (vehicle: Vehicle): number => {
  // Priorizar el timestamp de cuando se solicitó (historial de estados)
  // Ordenamos por fecha de solicitud: los más antiguos primero (menor timestamp = primero)
  const solicitadoTimestamp = getFirstStateTimestamp(vehicle, [
    'SOLICITADO',
    'EN LA PUERTA',
    'EN CAMINO',
  ]);

  if (solicitadoTimestamp !== undefined) {
    return solicitadoTimestamp;
  }

  // Si no tiene timestamp en historial, usar el campo 'ord' como respaldo si existe
  if (vehicle.ord !== undefined && vehicle.ord !== null && typeof vehicle.ord === 'number') {
    return vehicle.ord;
  }

  // Como último recurso, usar el timestamp de updatedAt/createdAt/horaIngreso
  return parseDateToTimestamp(vehicle.updatedAt || vehicle.createdAt || vehicle.horaIngreso);
};

export const getEntregaSortValue = (vehicle: Vehicle): number => {
  const entregaTimestamp = getFirstStateTimestamp(vehicle, ['ENTREGADO', 'FACTURADO']);

  if (entregaTimestamp !== undefined) {
    return entregaTimestamp;
  }

  return parseDateToTimestamp(vehicle.updatedAt || vehicle.createdAt || vehicle.horaIngreso);
};

export const sortVehiclesBy = (vehicles: Vehicle[], getValue: (vehicle: Vehicle) => number): Vehicle[] => {
  return [...vehicles].sort((a, b) => getValue(a) - getValue(b));
};




