import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shift, NewShiftBody, NewShiftResponse, EndShiftResponse } from '../types/shift';
import { STORAGE_KEYS } from '../config/constants';

const BASE_URL = 'http://149.50.128.181:4000';

// Crear una instancia de axios con configuración base
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const getEstablishmentShift = async (establishmentId: string): Promise<Shift> => {
  const response = await apiClient.get(`/api/turnos/establecimiento/${establishmentId}`);
  return response.data;
};

export const postShift = async (body: NewShiftBody): Promise<NewShiftResponse> => {
  const response = await apiClient.post('/api/turnos', body);
  return response.data;
};

export const postEndShift = async (establishmentId: string): Promise<EndShiftResponse> => {
  const response = await apiClient.post(`/api/turnos/finalizar/${establishmentId}`);
  return response.data;
};
