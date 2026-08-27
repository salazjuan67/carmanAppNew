import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from '../config/constants';
import type { IngresosListFilters } from '../types/vehicle';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigateAfterSessionExpired } from './sessionExpired';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UserResponse {
  user: User;
}

export interface User {
  _id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  establecimientos: string[];
  active: boolean;
  created_at: string;
  __v: number;
}

export interface Profile {
  _id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
}

class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Get authorization header with token
   */
  private async getAuthHeader(): Promise<Record<string, string>> {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      console.error('Error getting auth token:', error);
      return {};
    }
  }

  /**
   * Make HTTP request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const authHeader = await this.getAuthHeader();
      
      // Ensure Content-Type is set for POST/PUT/PATCH requests with body
      const headers: Record<string, string> = {
        ...API_CONFIG.HEADERS,
        ...authHeader,
        ...(options.headers as Record<string, string>),
      };

      // Remove Content-Type if body is FormData (let browser set it with boundary)
      if (options.body instanceof FormData) {
        delete headers['Content-Type'];
      }

      const config: RequestInit = {
        ...options,
        headers,
        timeout: this.timeout,
      };

      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      if (options.body && !(options.body instanceof FormData)) {
        console.log(`📤 Request body:`, typeof options.body === 'string' ? options.body.substring(0, 200) : options.body);
      }
      
      const response = await fetch(url, config);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let data: any;
      let errorMessage = '';

      if (isJson) {
        data = await response.json();
        console.log(`📦 Raw API Response:`, JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        // Solo mostrar error si no es un 404 (endpoint no disponible)
        if (response.status !== 404) {
          console.error(`❌ Non-JSON response:`, text.substring(0, 200));
        }
        errorMessage = text || `Server returned non-JSON response: ${response.status}`;
      }

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 422) {
          // Unprocessable Entity - validation errors
          let validationError = 'Error de validación';
          
          if (data) {
            // Try to extract validation error messages
            if (data.errors && Array.isArray(data.errors)) {
              validationError = data.errors.map((err: any) => 
                err.message || err.msg || JSON.stringify(err)
              ).join(', ');
            } else if (data.error) {
              validationError = data.error;
            } else if (data.message) {
              validationError = data.message;
            } else if (typeof data === 'string') {
              validationError = data;
            } else if (data.data && data.data.message) {
              validationError = data.data.message;
            }
          } else if (errorMessage) {
            validationError = errorMessage;
          }
          
          console.error(`❌ Validation Error (422):`, validationError);
          return {
            success: false,
            error: validationError,
          };
        } else if (response.status === 401) {
          // 401: no redirigir en login, ni en logout (el usuario ya está cerrando sesión; authService limpia local).
          const authError = data?.message || data?.error || 'No autorizado. Por favor inicia sesión nuevamente.';
          console.error(`❌ Authentication Error (401):`, authError);
          const skipGlobalSessionRedirect =
            endpoint === API_ENDPOINTS.LOGIN ||
            endpoint.includes('/auth/login') ||
            endpoint === API_ENDPOINTS.LOGOUT ||
            endpoint.includes('/auth/logout');
          if (!skipGlobalSessionRedirect) {
            void navigateAfterSessionExpired();
          }
          return {
            success: false,
            error: skipGlobalSessionRedirect ? authError : 'Sesión expirada',
          };
        } else if (response.status === 400) {
          // Bad Request
          const badRequestError = data?.message || data?.error || 'Solicitud inválida';
          console.error(`❌ Bad Request (400):`, badRequestError);
          return {
            success: false,
            error: badRequestError,
          };
        } else {
          // Other errors
          const genericError = data?.message || data?.error || errorMessage || `Error del servidor (${response.status})`;
          console.error(`❌ API Error (${response.status}):`, genericError);
          return {
            success: false,
            error: genericError,
          };
        }
      }

      console.log(`✅ API Response: ${response.status} ${url}`);
      return {
        success: true,
        data: data?.data || data,
        message: data?.message,
      };
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return {
          success: false,
          error: 'Error de conexión. Verifica tu conexión a internet.',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    // Validate credentials before sending
    if (!credentials.email || !credentials.password) {
      return {
        success: false,
        error: 'Email y contraseña son requeridos',
      };
    }

    // Trim email to avoid whitespace issues
    const trimmedCredentials = {
      email: credentials.email.trim(),
      password: credentials.password,
    };

    return this.makeRequest<LoginResponse>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(trimmedCredentials),
    });
  }

  /**
   * Logout user
   */
  async logout(): Promise<ApiResponse> {
    return this.makeRequest(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
    });
  }

  /**
   * Refresh token
   */
  async refreshToken(): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    try {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      return this.makeRequest<{ token: string; refreshToken: string }>(
        API_ENDPOINTS.REFRESH_TOKEN,
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }
      );
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      };
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<UserResponse> {
    const response = await this.makeRequest<UserResponse>(API_ENDPOINTS.USER_PROFILE);
    return response.data || { user: {} as User };
  }

  /**
   * Get establishments
   */
  async getEstablishments(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(API_ENDPOINTS.ESTABLISHMENTS);
  }

  /**
   * Listado de ingresos (Home) — misma base URL, headers y 401 que login / maestros.
   */
  async getVehicleEntries(
    establecimientoId: string,
    filters?: IngresosListFilters
  ): Promise<ApiResponse<any[]>> {
    const params: Record<string, string> = {};
    if (establecimientoId) params.establecimiento = establecimientoId;
    if (filters?.empleado) params.empleado = filters.empleado;
    if (filters?.patente?.trim()) params.patente = filters.patente.trim();
    if (filters?.marca) params.marca = filters.marca;
    if (filters?.created_at) params.created_at = filters.created_at;
    if (filters?.nroTicket?.trim()) params.nroTicket = filters.nroTicket.trim();

    const qs = new URLSearchParams(params).toString();
    const path = qs
      ? `${API_ENDPOINTS.VEHICLE_INGRESOS_LIST}?${qs}`
      : API_ENDPOINTS.VEHICLE_INGRESOS_LIST;
    return this.makeRequest<any[]>(path);
  }

  /**
   * Listado legacy (cobranzas) — mismo query que `getVehicleEntries`; solo cambia la ruta.
   * Se usa como respaldo si `/vehiculos/ingresos` no está disponible para el token/entorno.
   */
  async getVehicleEntriesCobranzas(
    establecimientoId: string,
    filters?: IngresosListFilters
  ): Promise<ApiResponse<any[]>> {
    const params: Record<string, string> = {};
    if (establecimientoId) params.establecimiento = establecimientoId;
    if (filters?.empleado) params.empleado = filters.empleado;
    if (filters?.patente?.trim()) params.patente = filters.patente.trim();
    if (filters?.marca) params.marca = filters.marca;
    if (filters?.created_at) params.created_at = filters.created_at;
    if (filters?.nroTicket?.trim()) params.nroTicket = filters.nroTicket.trim();

    const qs = new URLSearchParams(params).toString();
    const path = qs
      ? `${API_ENDPOINTS.VEHICLE_ENTRIES}?${qs}`
      : API_ENDPOINTS.VEHICLE_ENTRIES;
    return this.makeRequest<any[]>(path);
  }

  /**
   * Get vehicles
   */
  async getVehicles(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(API_ENDPOINTS.VEHICLES);
  }

  /**
   * Get notifications
   */
  async getNotifications(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(API_ENDPOINTS.NOTIFICATIONS);
  }

  /**
   * Get unread notifications
   */
  async getUnreadNotifications(): Promise<ApiResponse<any[]>> {
    return this.makeRequest<any[]>(API_ENDPOINTS.UNREAD_NOTIFICATIONS);
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    return this.makeRequest(API_ENDPOINTS.MARK_AS_READ(notificationId), {
      method: 'PUT',
    });
  }

  /**
   * Get current shift
   */
  async getCurrentShift(): Promise<ApiResponse<any>> {
    return this.makeRequest<any>(API_ENDPOINTS.CURRENT_SHIFT);
  }
}

export const apiClient = new ApiClient();
