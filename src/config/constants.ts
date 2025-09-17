// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.carman.com', // Reemplazar con la URL real de la API
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  
  // Vehicles
  VEHICLES: '/vehicles',
  VEHICLE_BY_ID: (id: string) => `/vehicles/${id}`,
  VEHICLE_ENTRY: '/vehicles/entry',
  VEHICLE_EXIT: '/vehicles/exit',
  
  // Establishments
  ESTABLISHMENTS: '/establishments',
  ESTABLISHMENT_BY_ID: (id: string) => `/establishments/${id}`,
  
  // Notifications
  NOTIFICATIONS: '/notifications',
  UNREAD_NOTIFICATIONS: '/notifications/unread',
  MARK_AS_READ: (id: string) => `/notifications/${id}/read`,
  
  // Shifts
  SHIFTS: '/shifts',
  CURRENT_SHIFT: '/shifts/current',
  
  // Users
  USERS: '/users',
  USER_PROFILE: '/users/profile',
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'Carman',
  VERSION: '1.0.0',
  SDK_VERSION: '54.0.0',
  SUPPORTED_LANGUAGES: ['es', 'en'],
  DEFAULT_LANGUAGE: 'es',
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  ESTABLISHMENT_DATA: 'establishment_data',
  LANGUAGE: 'language',
  THEME: 'theme',
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  POLLING_INTERVAL: 3000, // 3 seconds
  STALE_TIME: 2000, // 2 seconds
  CACHE_TIME: 10000, // 10 seconds
};

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  PULL_TO_REFRESH_THRESHOLD: 80,
};
