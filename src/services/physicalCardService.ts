import { API_CONFIG } from '../config/constants';
import { PhysicalCard, CardAssignmentResponse } from '../types/vehicle';

class PhysicalCardService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const token = await AsyncStorage.default.getItem('auth_token');
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      console.error('Error getting auth token:', error);
      return {};
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const authHeaders = await this.getAuthHeader();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    };


    try {
      const response = await fetch(url, config);
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      if (!responseText.trim()) {
        return {} as T;
      }

      const data = JSON.parse(responseText);
      return data;
    } catch (error: any) {
      console.error(`❌ Physical Card API Error: ${options.method || 'GET'} ${url}`, error);
      throw error;
    }
  }

  // Asignar tarjeta a un vehículo específico (después de crear el ingreso)
  async assignToVehicle(establishmentId: string, establishmentName: string, vehicleId: string, patente: string): Promise<CardAssignmentResponse> {
    return this.makeRequest<CardAssignmentResponse>('/physical-cards/assign-to-vehicle', {
      method: 'POST',
      body: JSON.stringify({ 
        establishmentId, 
        establishmentName,
        vehicleId,
        patente
      }),
    });
  }

  // Asignar automáticamente la próxima tarjeta disponible (método legacy)
  async assignNextAvailableCard(establishmentId: string, establishmentName: string): Promise<CardAssignmentResponse> {
    return this.makeRequest<CardAssignmentResponse>('/physical-cards/assign-next', {
      method: 'POST',
      body: JSON.stringify({ 
        establishmentId, 
        establishmentName 
      }),
    });
  }

  // Liberar tarjeta cuando se entrega el vehículo
  async releaseCard(cardId: string): Promise<void> {
    return this.makeRequest<void>(`/physical-cards/${cardId}/release`, {
      method: 'POST',
    });
  }

  // Obtener tarjetas disponibles para un establecimiento
  async getAvailableCards(establishmentId: string): Promise<PhysicalCard[]> {
    return this.makeRequest<PhysicalCard[]>(`/physical-cards/available?establishmentId=${establishmentId}`);
  }

  // Obtener tarjeta por QR code
  async getCardByQR(qrCode: string): Promise<PhysicalCard | null> {
    try {
      return await this.makeRequest<PhysicalCard>(`/physical-cards/qr/${qrCode}`);
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  // Obtener tarjeta por número
  async getCardByNumber(cardNumber: string): Promise<PhysicalCard | null> {
    try {
      return await this.makeRequest<PhysicalCard>(`/physical-cards/number/${cardNumber}`);
    } catch (error) {
      if (error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }
}

export const physicalCardService = new PhysicalCardService();
