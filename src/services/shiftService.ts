import { apiClient } from './apiClient';
import { API_ENDPOINTS } from '../config/constants';
import { Shift, NewShiftBody, NewShiftResponse, EndShiftResponse } from '../types/shift';

export const shiftService = {
  /**
   * Get active shift for an establishment
   */
  async getEstablishmentShift(establishmentId: string): Promise<Shift | null> {
    try {
      console.log('🔄 Getting shift for establishment:', establishmentId);
      const response = await apiClient.makeRequest<Shift>(
        `${API_ENDPOINTS.SHIFTS_BY_ESTABLISHMENT}/${establishmentId}`,
        'GET'
      );
      
      console.log('📦 Get shift response:', response);
      console.log('📦 Response success:', response.success);
      console.log('📦 Response data:', response.data);
      
      // Si la respuesta es exitosa pero no hay datos, devolver null
      if (response.success && response.data) {
        console.log('✅ Shift found:', response.data.nombre);
        return response.data;
      }
      
      // Si no hay turno activo, devolver null
      console.log('ℹ️ No active shift found for establishment:', establishmentId);
      return null;
    } catch (error: any) {
      console.error('❌ Error getting shift:', error);
      // Si no hay turno activo, devolver null
      if (error.response?.status === 404) {
        console.log('ℹ️ 404 - No shift found for establishment:', establishmentId);
        return null;
      }
      throw error;
    }
  },

  /**
   * Create a new shift
   */
  async createShift(body: NewShiftBody): Promise<NewShiftResponse> {
    console.log('🔄 Creating shift with body:', body);
    
    try {
      const response = await apiClient.makeRequest<NewShiftResponse>(
        API_ENDPOINTS.SHIFTS,
        'POST',
        body
      );
      
      console.log('📦 Shift creation response:', response);
      
      if (!response.success || !response.data) {
        // Si es un error 404, no es realmente un error para nosotros
        if (response.error?.includes('404')) {
          throw new Error('ENDPOINT_NOT_AVAILABLE');
        }
        // Solo mostrar error si no es un 404
        if (!response.error?.includes('404')) {
          console.error('❌ Shift creation failed:', response);
        }
        throw new Error(`Error al crear el turno: ${response.error || 'Respuesta inválida'}`);
      }
      
      return response.data;
    } catch (error: any) {
      // Si el endpoint no existe, mostrar error claro
      if (error.message.includes('404') || error.message.includes('non-JSON') || error.message === 'ENDPOINT_NOT_AVAILABLE') {
        console.log('❌ Shift endpoint not available - server error');
        throw new Error('El servicio de turnos no está disponible. Contacte al administrador del sistema.');
      }
      throw error;
    }
  },

  /**
   * End an active shift
   */
  async endShift(establishmentId: string): Promise<EndShiftResponse> {
    try {
      const response = await apiClient.makeRequest<EndShiftResponse>(
        `${API_ENDPOINTS.END_SHIFT}/${establishmentId}`,
        'POST'
      );
      
      if (!response.success || !response.data) {
        throw new Error('Error al cerrar el turno');
      }
      
      return response.data;
    } catch (error: any) {
      // Si el endpoint no existe, mostrar error claro
      if (error.message.includes('404') || error.message.includes('non-JSON')) {
        console.log('❌ End shift endpoint not available - server error');
        throw new Error('El servicio de turnos no está disponible. Contacte al administrador del sistema.');
      }
      throw error;
    }
  },
};
