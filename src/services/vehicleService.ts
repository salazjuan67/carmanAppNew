import { API_CONFIG, API_ENDPOINTS } from '../config/constants';
import { apiClient } from './apiClient';
import { navigateAfterSessionExpired } from './sessionExpired';
import {
  Vehicle,
  Brand,
  VehicleFound,
  VehicleFormData,
  UpdateVehicleState,
  ChangeEstadoResponse,
  Establishment,
  VehicleDataWithTime,
  IngresosListFilters,
} from '../types/vehicle';
/**
 * POST /cobranzas/ingresos a veces devuelve el documento en `data`, `ingreso`, o con `id` en lugar de `_id`.
 * Sin esto, `vehicle._id` queda undefined y el QR apunta a /ticket/undefined.
 */
function normalizeVehicleResponse(raw: unknown): Vehicle {
  if (raw == null || typeof raw !== 'object') {
    return raw as Vehicle;
  }

  let o = raw as Record<string, unknown>;

  const hasMongoId = typeof o._id === 'string';

  if (!hasMongoId && o.data != null && typeof o.data === 'object') {
    o = o.data as Record<string, unknown>;
  } else if (!hasMongoId && o.ingreso != null && typeof o.ingreso === 'object') {
    o = o.ingreso as Record<string, unknown>;
  }

  const id = o._id ?? o.id;
  if (id != null && o._id == null) {
    return { ...o, _id: String(id) } as Vehicle;
  }

  return o as Vehicle;
}

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
        if (response.status === 401) {
          void navigateAfterSessionExpired();
          throw new Error('401 - Sesión expirada');
        }
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

  async getEntries(
    establecimientoId: string,
    filters?: IngresosListFilters
  ): Promise<Vehicle[]> {
    const primary = await apiClient.getVehicleEntries(establecimientoId, filters);
    if (primary.success) {
      return this.normalizeVehicleListPayload(primary.data);
    }
    const errText = primary.error || 'Error al cargar ingresos';
    if (/\b401\b|sesión expirada/i.test(errText)) {
      throw new Error(errText);
    }
    console.warn('⚠️ Listado /vehiculos/ingresos falló, reintento /cobranzas/ingresos:', errText);
    const fallback = await apiClient.getVehicleEntriesCobranzas(establecimientoId, filters);
    if (!fallback.success) {
      throw new Error(fallback.error || errText);
    }
    return this.normalizeVehicleListPayload(fallback.data);
  }

  /** El GET /cobranzas/ingresos puede devolver array plano o { ingresos | data | results }. */
  private normalizeVehicleListPayload(raw: unknown): Vehicle[] {
    return this.extractVehicleList(raw);
  }

  private extractVehicleList(raw: unknown): Vehicle[] {
    if (raw == null) return [];
    if (Array.isArray(raw)) return raw as Vehicle[];
    if (typeof raw !== 'object') return [];
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.ingresos)) return o.ingresos as Vehicle[];
    if (Array.isArray(o.data)) return o.data as Vehicle[];
    if (Array.isArray(o.results)) return o.results as Vehicle[];
    if (o.data && typeof o.data === 'object' && o.data !== null) {
      const inner = o.data as Record<string, unknown>;
      if (Array.isArray(inner.ingresos)) return inner.ingresos as Vehicle[];
      if (Array.isArray(inner.data)) return inner.data as Vehicle[];
    }
    return [];
  }

  async getEntryById(id: string): Promise<Vehicle> {
    const result = await this.makeRequest<Vehicle>(`${API_ENDPOINTS.VEHICLE_INGRESOS_LIST}/${id}`);
    console.log('🔍 getEntryById - quienSeLleva:', result.quienSeLleva);

    return result;
  }

  async postEntry(vehicleData: VehicleDataWithTime, establishmentId: string): Promise<Vehicle> {
    if (!establishmentId?.trim()) {
      throw new Error('postEntry: establishmentId es obligatorio para el body establecimiento');
    }

    // Siempre enviar establecimiento desde el parámetro (establecimiento seleccionado en UI),
    // no solo el valor del formulario, para que el backend no resuelva el turno del usuario.
    const body = { ...vehicleData, establecimiento: establishmentId.trim() };

    console.log('📡 postEntry - Enviando POST a:', API_ENDPOINTS.VEHICLE_INGRESOS_POST);
    console.log('📦 postEntry - Body:', body);
    console.log('🔍 postEntry - quienSeLleva:', vehicleData.quienSeLleva);

    const response = await this.makeRequest<unknown>(
      API_ENDPOINTS.VEHICLE_INGRESOS_POST,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );

    const normalized = normalizeVehicleResponse(response);
    console.log('📨 postEntry - Respuesta recibida (normalizada):', normalized);
    return normalized;
  }

  async createVehicle(data: any) {
    console.log('🚗 Creating vehicle with data:', data);
    try {
      const result = await this.makeRequest(API_ENDPOINTS.VEHICLES, {
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
    const payload = { ...body, _id: idVehicle };
    console.log('🔄 Updating vehicle info:', { idVehicle, body: payload });
    console.log('🔄 Endpoint:', API_ENDPOINTS.VEHICLE_ENTRIES);
    console.log('🔄 Body JSON:', JSON.stringify(payload));

    try {
      console.log('🔄 About to call makeRequest...');
      const result = await this.makeRequest<void>(API_ENDPOINTS.VEHICLE_ENTRIES, {
        method: 'PUT',
        body: JSON.stringify(payload),
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

  async postEntryState(body: UpdateVehicleState): Promise<ChangeEstadoResponse> {
    console.log('=== POST ENTRY STATE ===');
    console.log('Sending request to:', API_ENDPOINTS.POST_ENTRIES_STATE);
    console.log('Body:', body);

    const response = await this.makeRequest<ChangeEstadoResponse>(API_ENDPOINTS.POST_ENTRIES_STATE, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    console.log('Response:', response);
    console.log('========================');

    if (response && response.success === false) {
      throw new Error(response.message || 'Estado inválido');
    }

    return response ?? { success: true };
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
      `${API_ENDPOINTS.ESTABLISHMENT}/${establishmentId}`
    );
    
    console.log('🏢 Establishment response:', response);
    
    return response;
  }

}

export const vehicleService = new VehicleService();
