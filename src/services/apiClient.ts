import { API_CONFIG, API_ENDPOINTS, STORAGE_KEYS } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      
      const config: RequestInit = {
        ...options,
        headers: {
          ...API_CONFIG.HEADERS,
          ...authHeader,
          ...options.headers,
        },
        timeout: this.timeout,
      };

      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
          // Check if response is JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            // Solo mostrar error si no es un 404 (endpoint no disponible)
            if (response.status !== 404) {
              console.error(`❌ Non-JSON response:`, text.substring(0, 200));
            }
            throw new Error(`Server returned non-JSON response: ${response.status}`);
          }
      
      const data = await response.json();

      console.log(`📦 Raw API Response:`, JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data?.message || `HTTP ${response.status}`);
      }

      console.log(`✅ API Response: ${response.status} ${url}`);
      return {
        success: true,
        data: data?.data || data,
        message: data?.message,
      };
    } catch (error) {
      console.error(`❌ API Error: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.makeRequest<LoginResponse>(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
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
