import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, LoginRequest, LoginResponse, User } from './apiClient';
import { STORAGE_KEYS } from '../config/constants';

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
        return { success: false, error: response.error || 'Login failed - invalid response structure' };
      }
    } catch (error) {
      this.setLoading(false);
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
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
        await this.logout();
        return false;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      await this.logout();
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
