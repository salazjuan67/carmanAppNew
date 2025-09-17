// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://149.50.128.181:4000', // URL real de la API Carman
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  USER_PROFILE: '/api/auth/user',
  
  // Masters
  BRANDS: '/api/masters/marcas',
  ESTABLISHMENTS: '/api/masters/establecimientos',
  
  // Vehicles
  VEHICLES: '/api/vehiculos',
  VEHICLE_BY_ID: (id: string) => `/api/vehiculos/${id}`,
  VEHICLE_ENTRIES: '/api/vehiculos/ingresos',
  SEARCH_PLATE: '/api/vehiculos/buscar',
  POST_ENTRIES_STATE: '/api/vehiculos/ingresos/estado',
  
  // Notifications
  NOTIFICATIONS: '/api/notificaciones',
  UNREAD_NOTIFICATIONS: '/api/notificaciones/unread',
  
  // Shifts
  SHIFTS: '/api/turnos',
  SHIFTS_BY_ESTABLISHMENT: '/api/turnos/establecimiento',
  END_SHIFT: '/api/turnos/finalizar',
  
  // QR
  QR_ENDPOINT: 'http://admin.carmanparking.com.ar/ticket',
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
