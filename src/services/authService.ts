import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, LoginRequest, LoginResponse, User } from './apiClient';
import { STORAGE_KEYS } from '../config/constants';
import { oneSignalService } from './oneSignalService';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

class AuthService {
  private static instance: AuthService;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    isLoading: false,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Initialize auth service - check for stored tokens
   */
  async initialize(): Promise<boolean> {
    try {
      this.setLoading(true);
      console.log('🔐 Initializing auth service...');

      const [token, refreshToken, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          this.authState = {
            isAuthenticated: true,
            user,
            token,
            refreshToken,
            isLoading: false,
          };
          
          // Configure OneSignal tags for the restored user
          await this.configureOneSignalTags(user);
          
          console.log('✅ User session restored');
          this.notifyListeners();
          return true;
        } catch (error) {
          console.error('❌ Error parsing stored user data:', error);
          await this.clearStoredData();
        }
      }

      this.authState.isLoading = false;
      this.notifyListeners();
      return false;
    } catch (error) {
      console.error('❌ Error initializing auth service:', error);
      this.authState.isLoading = false;
      this.notifyListeners();
      return false;
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      this.setLoading(true);
      console.log('🔐 Attempting login...');

      const response = await apiClient.login(credentials);

      console.log('🔍 Login response:', JSON.stringify(response, null, 2));

      if (response.success && response.data) {
        const { token } = response.data;
        
        // Store token first
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

        // Get user info after successful login
        try {
          const userResponse = await apiClient.getUserProfile();
          const user = userResponse.user;

          // Store user data
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

          // Update auth state
          this.authState = {
            isAuthenticated: true,
            user,
            token,
            refreshToken: null, // API doesn't provide refresh token
            isLoading: false,
          };

          // Configure OneSignal tags for the authenticated user
          await this.configureOneSignalTags(user);

          console.log('✅ Login successful');
          this.notifyListeners();
          return { success: true };
        } catch (userError) {
          console.error('❌ Error getting user profile:', userError);
          // Even if user profile fails, we still have the token
          this.authState = {
            isAuthenticated: true,
            user: null,
            token,
            refreshToken: null,
            isLoading: false,
          };
          this.notifyListeners();
          return { success: true };
        }
      } else {
        this.setLoading(false);
        console.log('❌ Login failed - response:', response);
        
        // Provide more descriptive error messages
        let errorMessage = response.error || 'Error al iniciar sesión';
        
        // Check for common validation errors
        if (errorMessage.includes('422') || errorMessage.includes('validación') || errorMessage.includes('validation')) {
          errorMessage = 'Error de validación. Verifica que el email y contraseña sean correctos.';
        } else if (errorMessage.includes('401') || errorMessage.includes('no autorizado') || errorMessage.includes('unauthorized')) {
          errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
        } else if (errorMessage.includes('400') || errorMessage.includes('bad request')) {
          errorMessage = 'Solicitud inválida. Verifica los datos ingresados.';
        } else if (errorMessage.includes('conexión') || errorMessage.includes('connection') || errorMessage.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        }
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      this.setLoading(false);
      console.error('❌ Login error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Error al iniciar sesión';
      
      if (error instanceof Error) {
        if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
        } else if (error.message.includes('422')) {
          errorMessage = 'Error de validación. Verifica que el email y contraseña sean correctos.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  /**
   * Limpia sesión local tras 401 (token vencido). No llama al API de logout.
   */
  async clearLocalSessionAfterUnauthorized(): Promise<void> {
    try {
      console.log('🔐 Sesión inválida (401) — limpiando almacenamiento local');
      try {
        await oneSignalService.setUserTags({});
      } catch (e) {
        console.warn('⚠️ OneSignal clear on session expire:', e);
      }
      await this.clearStoredData();
      this.authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
      };
      this.notifyListeners();
    } catch (error) {
      console.error('❌ clearLocalSessionAfterUnauthorized:', error);
      await this.clearStoredData();
      this.authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
      };
      this.notifyListeners();
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      console.log('🔐 Logging out...');
      
      // Call logout API
      await apiClient.logout();
      
      // Clear OneSignal tags
      try {
        await oneSignalService.setUserTags({});
        console.log('✅ OneSignal tags cleared');
      } catch (oneSignalError) {
        console.error('❌ Error clearing OneSignal tags:', oneSignalError);
      }
      
      // Clear stored data
      await this.clearStoredData();
      
      // Update auth state
      this.authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
      };

      console.log('✅ Logout successful');
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Even if API call fails, clear local data
      await this.clearStoredData();
      this.authState = {
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
      };
      this.notifyListeners();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshAuthToken(): Promise<boolean> {
    try {
      console.log('🔄 Refreshing auth token...');
      
      const response = await apiClient.refreshToken();
      
      if (response.success && response.data) {
        const { token, refreshToken } = response.data;
        
        // Update stored tokens
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
          AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
        ]);

        // Update auth state
        this.authState.token = token;
        this.authState.refreshToken = refreshToken;
        
        console.log('✅ Token refreshed successfully');
        this.notifyListeners();
        return true;
      } else {
        console.log('❌ Token refresh failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.authState.user;
  }

  /**
   * Get auth token
   */
  getToken(): string | null {
    return this.authState.token;
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Set loading state
   */
  private setLoading(isLoading: boolean): void {
    this.authState.isLoading = isLoading;
    this.notifyListeners();
  }

  /**
   * Clear stored authentication data
   */
  private async clearStoredData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
      ]);
    } catch (error) {
      console.error('❌ Error clearing stored data:', error);
    }
  }

  /**
   * Configure OneSignal tags for the authenticated user
   */
  private async configureOneSignalTags(user: User): Promise<void> {
    try {
      console.log('🔔 Configuring OneSignal tags for user:', user._id);
      
      // Set establishment_id tag if user has an establishment
      if (user.establecimiento?._id) {
        await oneSignalService.setUserTags({
          establishment_id: user.establecimiento._id,
          user_id: user._id,
          user_email: user.email,
        });
        console.log('✅ OneSignal tags configured:', {
          establishment_id: user.establecimiento._id,
          user_id: user._id,
          user_email: user.email,
        });
      } else {
        console.log('⚠️ User has no establishment, skipping OneSignal tag configuration');
      }
    } catch (error) {
      console.error('❌ Error configuring OneSignal tags:', error);
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.authState });
      } catch (error) {
        console.error('❌ Error notifying auth listener:', error);
      }
    });
  }
}

export const authService = AuthService.getInstance();
