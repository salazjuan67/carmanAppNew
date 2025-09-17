// Base Types
export interface BaseEntity {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

// User Types
export interface User extends BaseEntity {
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  isActive: boolean;
  lastLogin?: string;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

// Vehicle Types
export interface Vehicle extends BaseEntity {
  patente: string;
  marca: string;
  modelo: string;
  color: string;
  tipo: 'auto' | 'moto' | 'camion' | 'otro';
  estado: 'ingresado' | 'solicitado' | 'retirado';
  sector?: string;
  establecimiento: string;
  entrada: string;
  salida?: string;
  observaciones?: string;
  imagen?: string;
}

export interface VehicleEntry {
  patente: string;
  marca: string;
  modelo: string;
  color: string;
  tipo: 'auto' | 'moto' | 'camion' | 'otro';
  sector?: string;
  establecimiento: string;
  observaciones?: string;
  imagen?: string;
}

// Establishment Types
export interface Establishment extends BaseEntity {
  name: string;
  address: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  settings: EstablishmentSettings;
}

export interface EstablishmentSettings {
  allowGuestAccess: boolean;
  requireApproval: boolean;
  maxVehicles: number;
  notificationSettings: NotificationSettings;
}

// Notification Types
export interface Notification extends BaseEntity {
  title: string;
  body: string;
  type: 'vehicle_requested' | 'vehicle_entered' | 'vehicle_exited' | 'system';
  isRead: boolean;
  data?: Record<string, any>;
  userId?: string;
  establishmentId: string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Shift Types
export interface Shift extends BaseEntity {
  userId: string;
  establishmentId: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'image';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Navigation Types
export type RootStackParamList = {
  index: undefined;
  auth: undefined;
  home: undefined;
  profile: undefined;
};

// Store Types
export interface AppState {
  user: User | null;
  establishment: Establishment | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  language: string;
  theme: 'light' | 'dark';
}
