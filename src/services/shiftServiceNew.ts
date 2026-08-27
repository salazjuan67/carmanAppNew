import axios, { AxiosError, isAxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shift, NewShiftBody, NewShiftResponse, EndShiftResponse } from '../types/shift';
import { STORAGE_KEYS, API_CONFIG, getShiftApiRoot } from '../config/constants';
import { navigateAfterSessionExpired } from './sessionExpired';

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

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      void navigateAfterSessionExpired();
    }
    return Promise.reject(error);
  }
);

function unwrapPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const envelope = payload as ApiEnvelope<T>;
    if (envelope.data !== undefined) {
      return envelope.data;
    }
  }
  return payload as T;
}

function parseShiftRecord(payload: unknown): Shift | null {
  const record = unwrapPayload<Shift | null>(payload);
  if (!record || typeof record !== 'object') return null;
  if (!('_id' in record) || !record._id) return null;
  return record;
}

function parseMutationRecord<T extends { _id?: string }>(payload: unknown): T {
  const record = unwrapPayload<T>(payload);
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
  if (isAxiosError(error)) {
    const data = error.response?.data as ApiEnvelope<unknown> | undefined;
    const message =
      data?.message ||
      (typeof data === 'object' && data && 'error' in data
        ? String((data as { error?: string }).error)
        : undefined) ||
      error.message;
    return new ShiftApiError(
      message || 'Error de conexión con el servidor de turnos',
      error.response?.status
    );
  }
  if (error instanceof ShiftApiError) return error;
  if (error instanceof Error) return new ShiftApiError(error.message);
  return new ShiftApiError('Error desconocido al procesar el turno');
}

export const getEstablishmentShift = async (
  establishmentId: string
): Promise<Shift | null> => {
  try {
    const root = getShiftApiRoot();
    const response = await apiClient.get(`${root}/establecimiento/${establishmentId}`);
    const envelope = response.data as ApiEnvelope<Shift>;

    if (envelope?.success === false) {
      return null;
    }

    return parseShiftRecord(response.data);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    throw formatShiftError(error);
  }
};

export const postShift = async (body: NewShiftBody): Promise<NewShiftResponse> => {
  try {
    const path = getShiftApiRoot();
    const response = await apiClient.post(path, body);
    const envelope = response.data as ApiEnvelope<NewShiftResponse>;

    if (envelope?.success === false) {
      throw new Error(envelope.message || 'No se pudo abrir el turno');
    }

    return parseMutationRecord<NewShiftResponse>(response.data);
  } catch (error) {
    throw formatShiftError(error);
  }
};

export const postEndShift = async (establishmentId: string): Promise<EndShiftResponse> => {
  try {
    const root = getShiftApiRoot();
    const response = await apiClient.post(`${root}/finalizar/${establishmentId}`);
    const envelope = response.data as ApiEnvelope<EndShiftResponse>;

    if (envelope?.success === false) {
      throw new Error(envelope.message || 'No se pudo cerrar el turno');
    }

    return parseMutationRecord<EndShiftResponse>(response.data);
  } catch (error) {
    throw formatShiftError(error);
  }
};
