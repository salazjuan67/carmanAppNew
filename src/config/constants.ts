import Constants from 'expo-constants';

/**
 * Base del API: dominio HTTPS (mismo criterio que carman-front / admin).
 * - EXPO_PUBLIC_API_BASE_URL: override (.env local, o eas.json env en preview/production para que el APK use la misma base que login).
 * - Dev web en localhost: /expo-api (proxy Metro → carmanparking.com) para evitar CORS en el navegador.
 */
function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.replace(/\/$/, '');
  }
  if (
    typeof __DEV__ !== 'undefined' &&
    __DEV__ &&
    typeof window !== 'undefined' &&
    (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')
  ) {
    return `${window.location.origin}/expo-api`;
  }
  return 'https://carmanparking.com/api';
}

export const API_CONFIG = {
  BASE_URL: resolveApiBaseUrl(),
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

/**
 * Raíz HTTP de turnos relativa a `API_CONFIG.BASE_URL`.
 * - Si `BASE_URL` termina en `/api` → `/turnos` (URL final …/api/turnos).
 * - Si no (solo host) → `/api/turnos` para no duplicar ni omitir el prefijo del backend.
 */
export function getShiftApiRoot(): string {
  const base = API_CONFIG.BASE_URL.replace(/\/$/, '');
  // BASE_URL ya incluye el prefijo del API (…/api o …/expo-api en dev web).
  if (base.endsWith('/api') || base.endsWith('/expo-api')) {
    return '/turnos';
  }
  return '/api/turnos';
}

// API Endpoints (rutas relativas a BASE_URL; el prefijo /api va en el dominio)
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh',
  USER_PROFILE: '/auth/user',

  // Masters (plural) — lista mobile; GET por id usa ESTABLISHMENT (singular, /master/ sin S)
  BRANDS: '/masters/marcas',
  ESTABLISHMENTS: '/masters/establecimientos',
  /** Base para GET un establecimiento por id: `${ESTABLISHMENT}/${id}` → /api/master/establecimientos/:id */
  ESTABLISHMENT: '/master/establecimientos',

  // Maestra de vehículos (listado/CRUD; backend: /api/master/vehiculos)
  VEHICLES: '/master/vehiculos',
  VEHICLE_BY_ID: (id: string) => `/master/vehiculos/${id}`,
  // Cobranzas: PUT edición desde flujos que comparten handler con panel (puede filtrar por usuario en GET)
  VEHICLE_ENTRIES: '/cobranzas/ingresos',
  /** GET listado ingresos para la app valet — mismo criterio que POST; evita filtro por empleado de cobranzas */
  VEHICLE_INGRESOS_LIST: '/vehiculos/ingresos',
  /** POST nuevo ingreso — flujo app empleados (handler mobile; no es el mismo que cobranzas) */
  VEHICLE_INGRESOS_POST: '/vehiculos/ingresos',
  SEARCH_PLATE: '/master/vehiculos/buscar',
  POST_ENTRIES_STATE: '/vehiculos/ingresos/estado',

  // Notifications
  NOTIFICATIONS: '/notificaciones',
  UNREAD_NOTIFICATIONS: '/notificaciones/unread',
  MARK_AS_READ: (notificationId: string) => `/notificaciones/${notificationId}/read`,
  STATE_CHANGE_NOTIFICATION: '/notifications/state-change',

  // Shifts
  SHIFTS: '/turnos',
  SHIFTS_BY_ESTABLISHMENT: '/turnos/establecimiento',
  END_SHIFT: '/turnos/finalizar',
  CURRENT_SHIFT: '/turnos/actual',

  // QR (página de ticket — mismo dominio, sin puerto)
  QR_ENDPOINT: 'https://carmanparking.com/ticket',

  // Physical Cards
  PHYSICAL_CARDS_ASSIGN_TO_VEHICLE: '/physical-cards/assign-to-vehicle',
  PHYSICAL_CARDS_ASSIGN_NEXT: '/physical-cards/assign-next',
  PHYSICAL_CARDS_RELEASE: (cardId: string) => `/physical-cards/${cardId}/release`,
  PHYSICAL_CARDS_AVAILABLE: '/physical-cards/available',
  PHYSICAL_CARDS_BY_QR: (qrCode: string) => `/physical-cards/qr/${qrCode}`,
  PHYSICAL_CARDS_BY_NUMBER: (cardNumber: string) =>
    `/physical-cards/number/${cardNumber}`,
};

/** Misma versión que `expo.version` en app.json (EAS / stores). */
const appVersion =
  Constants.expoConfig?.version ??
  (Constants.manifest as { version?: string } | null)?.version ??
  '14.2.0';

// App Configuration
export const APP_CONFIG = {
  NAME: 'Carman',
  VERSION: appVersion,
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

/**
 * Canal Android (API 26+). Las notificaciones remotas (OneSignal/FCM) deben usar el mismo
 * `android_channel_id` en el payload para sonido con la app minimizada.
 * En OneSignal (REST o dashboard): p. ej. `android_channel_id` = este id, `android_sound` = default,
 * prioridad alta; iOS: `ios_sound` / categoría con sonido.
 */
export const ANDROID_VEHICLE_NOTIFICATION_CHANNEL_ID = 'vehicle-requested-v1';

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  PULL_TO_REFRESH_THRESHOLD: 80,
};

// OneSignal Configuration
export const ONESIGNAL_CONFIG = {
  APP_ID: '2e8adea2-edb7-425c-acda-17df0ef92d9f',
  ENABLED: true,
};
