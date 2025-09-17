import { API_CONFIG, API_ENDPOINTS } from '../config/constants';
import { Vehicle, Brand, VehicleFound, VehicleFormData, UpdateVehicleState } from '../types/vehicle';

class VehicleService {
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

    console.log(`🌐 Vehicle API Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, config);
    const data = await response.json();

    console.log(`📦 Vehicle API Response:`, JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    console.log(`✅ Vehicle API Response: ${response.status} ${url}`);
    return data;
  }

  async getBrands(): Promise<Brand[]> {
    return this.makeRequest<Brand[]>(API_ENDPOINTS.BRANDS);
  }

  async getEntries(establishmentId: string): Promise<Vehicle[]> {
    const url = `${API_ENDPOINTS.VEHICLE_ENTRIES}?establecimiento=${establishmentId}`;
    return this.makeRequest<Vehicle[]>(url);
  }

  async getEntryById(id: string): Promise<Vehicle> {
    return this.makeRequest<Vehicle>(`${API_ENDPOINTS.VEHICLE_ENTRIES}/${id}`);
  }

  async postEntry(vehicle: VehicleFormData): Promise<Vehicle> {
    console.log('📡 postEntry - Enviando POST a:', API_ENDPOINTS.VEHICLE_ENTRIES);
    console.log('📦 postEntry - Datos del vehículo:', vehicle);
    
    const response = await this.makeRequest<Vehicle>(
      API_ENDPOINTS.VEHICLE_ENTRIES,
      {
        method: 'POST',
        body: JSON.stringify(vehicle),
      }
    );
    
    console.log('📨 postEntry - Respuesta recibida:', response);
    return response;
  }

  async putEntryInfo(idVehicle: string, body: { patente: string; sector: string }): Promise<void> {
    await this.makeRequest<void>(`${API_ENDPOINTS.VEHICLE_ENTRIES}/${idVehicle}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async postEntryState(body: UpdateVehicleState): Promise<void> {
    console.log('=== POST ENTRY STATE ===');
    console.log('Sending request to:', API_ENDPOINTS.POST_ENTRIES_STATE);
    console.log('Body:', body);
    
    const response = await this.makeRequest<void>(API_ENDPOINTS.POST_ENTRIES_STATE, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    console.log('Response:', response);
    console.log('========================');
    
    return response;
  }

  async getSearchPlate(patente: string, establishmentId: string): Promise<VehicleFound> {
    const url = `${API_ENDPOINTS.SEARCH_PLATE}/${patente}?establecimiento=${establishmentId}`;
    return this.makeRequest<VehicleFound>(url);
  }
}

export const vehicleService = new VehicleService();
