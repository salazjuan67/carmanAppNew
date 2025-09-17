import { apiClient } from './apiClient';
import { Shift, NewShiftBody, NewShiftResponse, EndShiftResponse } from '../types/shift';

const API_ENDPOINTS = {
  GET_SHIFTS_BY_ESTABLISHMENT: '/api/turnos/establecimiento',
  POST_SHIFT: '/api/turnos',
  POST_END_SHIFT: '/api/turnos/finalizar',
};

export const shiftService = {
  /**
   * Get active shift for an establishment
   */
  async getEstablishmentShift(establishmentId: string): Promise<Shift | null> {
    try {
      const response = await apiClient.makeRequest<Shift>(
        `${API_ENDPOINTS.GET_SHIFTS_BY_ESTABLISHMENT}/${establishmentId}`,
        'GET'
      );
      return response.data;
    } catch (error: any) {
      // Si no hay turno activo, devolver null
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create a new shift
   */
  async createShift(body: NewShiftBody): Promise<NewShiftResponse> {
    const response = await apiClient.makeRequest<NewShiftResponse>(
      API_ENDPOINTS.POST_SHIFT,
      'POST',
      body
    );
    return response.data;
  },

  /**
   * End an active shift
   */
  async endShift(establishmentId: string): Promise<EndShiftResponse> {
    const response = await apiClient.makeRequest<EndShiftResponse>(
      `${API_ENDPOINTS.POST_END_SHIFT}/${establishmentId}`,
      'POST'
    );
    return response.data;
  },
};
