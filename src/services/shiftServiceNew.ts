import { Shift, NewShiftBody, NewShiftResponse, EndShiftResponse } from '../types/shift';
import { apiClient } from './apiClient';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export class ShiftApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ShiftApiError';
    this.status = status;
  }
}

function unwrapPayload<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') return payload as T;

  const envelope = payload as ApiEnvelope<T> & {
    turno?: unknown;
    shift?: unknown;
    result?: unknown;
  };

  if (envelope.data !== undefined && envelope.data !== payload) {
    return unwrapPayload<T>(envelope.data);
  }

  // Algunos handlers antiguos devuelven el turno bajo `turno` o `shift`.
  if (envelope.turno && typeof envelope.turno === 'object') {
    return envelope.turno as T;
  }
  if (envelope.shift && typeof envelope.shift === 'object') {
    return envelope.shift as T;
  }
  if (envelope.result && typeof envelope.result === 'object') {
    return envelope.result as T;
  }

  return payload as T;
}

function parseShiftRecord(payload: unknown): Shift | null {
  const record = unwrapPayload<Shift | null>(payload);
  if (!record || typeof record !== 'object') return null;
  if (!('_id' in record) || !record._id) return null;
  return record;
}

function parseMutationRecord<T extends { _id?: string }>(
  payload: unknown,
  fallbackName: string
): T {
  const record = unwrapPayload<T>(payload);
  if (record && typeof record === 'object' && record._id) {
    return record;
  }

  const envelope = payload as ApiEnvelope<unknown>;
  if (envelope?.success === true) {
    // Cerrar turno puede responder { success: true, message } sin devolver el documento.
    return {
      _id: '',
      nombre: envelope.message || fallbackName,
    } as T;
  }

  if (!record || typeof record !== 'object' || !record._id) {
    const envelope = payload as ApiEnvelope<unknown>;
    if (envelope?.success === false) {
      throw new Error(envelope.message || 'Respuesta inválida del servidor');
    }
    throw new Error('Respuesta inválida del servidor');
  }
  return record;
}

function formatShiftError(error: unknown): ShiftApiError {
  if (error instanceof ShiftApiError) return error;
  if (error instanceof Error) return new ShiftApiError(error.message);
  return new ShiftApiError('Error desconocido al procesar el turno');
}

export const getEstablishmentShift = async (
  establishmentId: string
): Promise<Shift | null> => {
  try {
    const response = await apiClient.getEstablishmentShift(establishmentId);
    if (!response.success) {
      // La consulta sin turno puede responder 404 según la versión del backend.
      if (/404|not found|no active/i.test(response.error || '')) {
        return null;
      }
      throw new ShiftApiError(
        response.error || 'No se pudo consultar el turno'
      );
    }

    return parseShiftRecord(response.data ?? null);
  } catch (error) {
    throw formatShiftError(error);
  }
};

export const postShift = async (body: NewShiftBody): Promise<NewShiftResponse> => {
  try {
    const response = await apiClient.createShift(body);
    if (!response.success) {
      throw new ShiftApiError(response.error || 'No se pudo abrir el turno');
    }

    return parseMutationRecord<NewShiftResponse>(
      response.data,
      'Turno abierto correctamente'
    );
  } catch (error) {
    throw formatShiftError(error);
  }
};

export const postEndShift = async (establishmentId: string): Promise<EndShiftResponse> => {
  try {
    const response = await apiClient.endEstablishmentShift(establishmentId);
    if (!response.success) {
      throw new ShiftApiError(response.error || 'No se pudo cerrar el turno');
    }

    return parseMutationRecord<EndShiftResponse>(
      response.data,
      'Turno cerrado correctamente'
    );
  } catch (error) {
    throw formatShiftError(error);
  }
};
