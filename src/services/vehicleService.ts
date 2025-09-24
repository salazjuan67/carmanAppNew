import { API_CONFIG, API_ENDPOINTS } from '../config/constants';
import { Vehicle, Brand, VehicleFound, VehicleFormData, UpdateVehicleState, Establishment, VehicleDataWithTime } from '../types/vehicle';

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
    console.log(`🌐 Request config:`, config);

    try {
      console.log(`🌐 About to make fetch request...`);
      const response = await fetch(url, config);
      console.log(`🌐 Fetch completed, got response`);
      
      // Verificar si la respuesta es HTML en lugar de JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.warn(`⚠️ API returned HTML instead of JSON for ${url}`);
        throw new Error(`API endpoint not found or returned HTML: ${url}`);
      }
      
      // Verificar si la respuesta está vacía
      console.log(`🌐 About to read response text...`);
      const responseText = await response.text();
      console.log(`🌐 Response text read successfully`);
      console.log(`📦 Raw response text for ${url}:`, responseText);
      console.log(`📦 Response status: ${response.status}, ok: ${response.ok}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      // Si la respuesta está vacía, devolver un objeto vacío
      if (!responseText.trim()) {
        console.log(`📦 Vehicle API Response: Empty response for ${url}`);
        return {};
      }

      // Intentar parsear como JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.warn(`⚠️ Failed to parse JSON response for ${url}:`, responseText);
        console.warn(`⚠️ Response status: ${response.status}, ok: ${response.ok}`);
        // Si la operación fue exitosa pero la respuesta no es JSON válido, devolver un objeto vacío
        if (response.ok) {
          console.log(`📦 Returning empty object for successful operation with invalid JSON response`);
          return {};
        }
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log(`📦 Vehicle API Response:`, JSON.stringify(data, null, 2));
      console.log(`✅ Vehicle API Response: ${response.status} ${url}`);
      return data;
    } catch (error: any) {
      console.error(`❌ Vehicle API Error: ${options.method || 'GET'} ${url}`, error);
      throw error;
    }
  }

  async getBrands(): Promise<Brand[]> {
    console.log('🏷️ Getting brands from:', API_ENDPOINTS.BRANDS);
    try {
      const response = await this.makeRequest<Brand[]>(API_ENDPOINTS.BRANDS);
      console.log('🏷️ Brands response:', response);
      return response;
    } catch (error) {
      console.error('🏷️ Error getting brands:', error);
      throw error;
    }
  }

  async getEntries(establishmentId: string): Promise<Vehicle[]> {
    const url = `${API_ENDPOINTS.VEHICLE_ENTRIES}?establecimiento=${establishmentId}`;
    return this.makeRequest<Vehicle[]>(url);
  }

  async getEntryById(id: string): Promise<Vehicle> {
    const result = await this.makeRequest<Vehicle>(`${API_ENDPOINTS.VEHICLE_ENTRIES}/${id}`);
    
    // Debug temporal
    console.log('🔍 getEntryById - quienSeLleva:', result.quienSeLleva);
    
    return result;
  }

  async postEntry(vehicleData: VehicleDataWithTime): Promise<Vehicle> {
    console.log('📡 postEntry - Enviando POST a:', API_ENDPOINTS.VEHICLE_ENTRIES);
    console.log('📦 postEntry - Datos del vehículo:', vehicleData);
    
    // Debug temporal
    console.log('🔍 postEntry - quienSeLleva:', vehicleData.quienSeLleva);
    
    const response = await this.makeRequest<Vehicle>(
      API_ENDPOINTS.VEHICLE_ENTRIES,
      {
        method: 'POST',
        body: JSON.stringify(vehicleData),
      }
    );
    
    console.log('📨 postEntry - Respuesta recibida:', response);
    return response;
  }

  async createVehicle(data: any) {
    console.log('🚗 Creating vehicle with data:', data);
    try {
      const result = await this.makeRequest('/api/vehiculos', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('🚗 Vehicle created successfully:', result);
      return result;
    } catch (error) {
      console.error('🚗 Error creating vehicle:', error);
      throw error;
    }
  }

  async putEntryInfo(idVehicle: string, body: any): Promise<void> {
    console.log('🔄 Updating vehicle info:', { idVehicle, body });
    console.log('🔄 Endpoint:', `${API_ENDPOINTS.VEHICLE_ENTRIES}/${idVehicle}`);
    console.log('🔄 Body JSON:', JSON.stringify(body));
    
    try {
      console.log('🔄 About to call makeRequest...');
      const result = await this.makeRequest<void>(`${API_ENDPOINTS.VEHICLE_ENTRIES}/${idVehicle}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      console.log('✅ Vehicle info updated successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error in putEntryInfo:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      console.error('❌ Full error object:', error);
      throw error;
    }
  }

  async postEntryState(body: UpdateVehicleState): Promise<void> {
    console.log('=== POST ENTRY STATE ===');
    console.log('Sending request to:', API_ENDPOINTS.POST_ENTRIES_STATE);
    console.log('Body:', body);
    
    const response = await this.makeRequest<any>(API_ENDPOINTS.POST_ENTRIES_STATE, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    
    console.log('Response:', response);
    console.log('========================');
    
    return response;
  }

  async getSearchPlate(patente: string, establishmentId: string): Promise<VehicleFound | null> {
    const authHeaders = await this.getAuthHeader();

    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
    };

    console.log(`🔍 Searching plate: ${patente} in establishment: ${establishmentId}`);

    try {
      // Primero buscar globalmente para obtener los datos del vehículo
      let globalUrl = `${this.baseURL}${API_ENDPOINTS.SEARCH_PLATE}/${patente}`;
      console.log(`🌐 Vehicle API Request (global): GET ${globalUrl}`);
      
      let globalResponse = await fetch(globalUrl, config);
      
      // Verificar si la respuesta es HTML en lugar de JSON
      const contentType = globalResponse.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.warn(`⚠️ API returned HTML instead of JSON for ${globalUrl}`);
        throw new Error(`API endpoint not found or returned HTML: ${globalUrl}`);
      }
      
      let globalData = await globalResponse.json();
      console.log(`📦 Vehicle API Response (global):`, JSON.stringify(globalData, null, 2));

      if (!globalResponse.ok) {
        // Si no se encuentra globalmente, la patente no existe
        if (globalResponse.status === 404) {
          console.log('🔍 Plate not found globally (404) - this is normal for new vehicles');
          return null;
        }
        throw new Error(globalData.message || `HTTP ${globalResponse.status}`);
      }

      // Ahora buscar en el establecimiento específico para obtener el estado VIP
      let establishmentUrl = `${this.baseURL}${API_ENDPOINTS.SEARCH_PLATE}/${patente}?establecimiento=${establishmentId}`;
      console.log(`🌐 Vehicle API Request (establishment): GET ${establishmentUrl}`);
      
      let establishmentResponse = await fetch(establishmentUrl, config);
      let establishmentData = await establishmentResponse.json();
      console.log(`📦 Vehicle API Response (establishment):`, JSON.stringify(establishmentData, null, 2));

      // Combinar los datos: datos globales del vehículo + estado VIP del establecimiento
      // Si el vehículo no se encuentra en el establecimiento específico, usar el estado VIP global
      const isVipInEstablishment = establishmentResponse.ok ? establishmentData.vip : globalData.vip;
      const isInhabilitadoInEstablishment = establishmentResponse.ok ? establishmentData.inhabilitado : globalData.inhabilitado;
      
      console.log(`🏢 Establishment VIP Status:`, {
        establishmentId,
        establishmentResponseOk: establishmentResponse.ok,
        vipStatus: isVipInEstablishment,
        inhabilitadoStatus: isInhabilitadoInEstablishment,
        establishmentData: establishmentData,
        establishmentResponseStatus: establishmentResponse.status,
        establishmentResponseText: establishmentResponse.ok ? 'OK' : 'ERROR',
        globalVipStatus: globalData.vip,
        usingGlobalVip: !establishmentResponse.ok
      });

      const combinedData = {
        ...globalData,
        vip: isVipInEstablishment,
        inhabilitado: isInhabilitadoInEstablishment,
      };

      console.log(`✅ Combined vehicle data:`, JSON.stringify(combinedData, null, 2));
      return combinedData;

    } catch (error: any) {
      console.error(`❌ Vehicle API Error: GET ${globalUrl}`, error);
      throw error;
    }
  }

  /**
   * Get establishment data including sectors
   */
  async getEstablishment(establishmentId: string): Promise<Establishment> {
    const response = await this.makeRequest<Establishment>(
      `${API_ENDPOINTS.ESTABLISHMENTS}/${establishmentId}`,
      'GET'
    );
    
    console.log('🏢 Establishment response:', response);
    
    return response;
  }

}

export const vehicleService = new VehicleService();
