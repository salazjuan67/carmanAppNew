import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { API_ENDPOINTS, API_CONFIG, ANDROID_VEHICLE_NOTIFICATION_CHANNEL_ID, NOTIFICATIONS_CONFIG } from '../config/constants';
import { apiClient } from './apiClient';
import { useHomeUiStore } from '../store/homeUiStore';
import { soundService } from './soundService';

const notificationsEnabled = () =>
  NOTIFICATIONS_CONFIG.ENABLED &&
  ((Platform.OS === 'ios' && NOTIFICATIONS_CONFIG.IOS_ENABLED) ||
    (Platform.OS === 'android' && NOTIFICATIONS_CONFIG.ANDROID_ENABLED));

// Solo registrar handler si las notificaciones están habilitadas
if (notificationsEnabled()) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.warn('⚠️ setNotificationHandler failed:', e);
  }
}

export class NotificationService {
  private static instance: NotificationService;
  private deviceToken: string | null = null;
  private initialized = false;
  private listenersConfigured = false;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Initialize notification service
   */
  async initialize(): Promise<boolean> {
    if (!notificationsEnabled()) {
      return false;
    }
    if (this.initialized && this.deviceToken) {
      return true;
    }
    try {
      console.log('🔔 Initializing notification service...');

      // Do not prompt on cold start (can contribute to launch races on iOS).
      // Only check current status; permission UI is requested later from the hook.
      const current = await Notifications.getPermissionsAsync();
      if (current.status !== 'granted') {
        console.log('ℹ️ Notification permission not granted yet');
        return false;
      }

      await this.ensureAndroidVehicleChannel();

      // Get device token (Android requires FCM/Firebase; skip gracefully if not configured)
      if (Platform.OS !== 'web') {
        try {
          const token = await Notifications.getExpoPushTokenAsync({
            projectId: 'b6860274-7285-4382-83d0-2c63a93ca0fb',
          });
          this.deviceToken = token.data;
          console.log('✅ Device token obtained:', this.deviceToken?.substring(0, 20) + '...');
        } catch (tokenError: any) {
          const msg = tokenError?.message || String(tokenError);
          if (msg.includes('Firebase') || msg.includes('FCM') || msg.includes('FirebaseApp')) {
            console.log('ℹ️ Push token unavailable (FCM/Firebase not configured). Local notifications still work.');
          } else {
            console.warn('⚠️ Could not get push token:', msg);
          }
          this.deviceToken = null;
        }
      }

      // Setup notification listeners only once (Home can mount more than once).
      if (!this.listenersConfigured) {
        this.setupNotificationListeners();
        this.listenersConfigured = true;
      }

      this.initialized = true;
      console.log('✅ Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      return false;
    }
  }

  private async ensureAndroidVehicleChannel(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      await Notifications.setNotificationChannelAsync(ANDROID_VEHICLE_NOTIFICATION_CHANNEL_ID, {
        name: 'Solicitudes de vehículo',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 400, 250, 400],
        sound: 'default',
        enableVibrate: true,
      });
    } catch (e) {
      console.warn('⚠️ No se pudo crear el canal de notificaciones Android:', e);
    }
  }

  /**
   * Setup notification event listeners
   */
  private setupNotificationListeners() {
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📱 Notification received:', notification);
      const data = notification.request.content.data;
      if (data?.type === 'vehicle_requested') {
        useHomeUiStore.getState().requestSolicitadosTabOnHome();
        useHomeUiStore.getState().requestVehiclesRefresh();
        void soundService.playNotificationSound();
      }
    });

    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('📱 Notification tapped:', response);
      this.handleNotificationTap(response);
    });
  }

  private handleNotificationTap(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;

    if (data?.type === 'vehicle_requested') {
      console.log('🚗 Vehicle requested notification tapped → home / Solicitados');
      useHomeUiStore.getState().requestSolicitadosTabOnHome();
      useHomeUiStore.getState().requestVehiclesRefresh();
      router.replace('/home');
    }
  }

  /**
   * Get unread notifications count from backend (like the old app)
   */
  async getUnreadCount(establishmentId: string): Promise<number> {
    if (!notificationsEnabled()) return 0;
    try {
      if (!establishmentId) {
        console.log('❌ No establishment ID provided for unread count');
        return 0;
      }

      console.log('🔔 Fetching unread notifications count for establishment:', establishmentId);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.UNREAD_NOTIFICATIONS}?establishmentId=${establishmentId}`, {
        method: 'GET',
        headers: API_CONFIG.HEADERS,
      });

      if (response.ok) {
        const data = await response.json();
        const count = typeof data === 'number' ? data : data?.count || 0;
        console.log('✅ Unread notifications count:', count);
        return count;
      } else {
        // Silently handle 404 (endpoint not implemented) and other errors
        if (response.status === 404) {
          console.log('ℹ️ Backend notifications endpoint not implemented yet - using local notifications');
        } else {
          console.log('⚠️ Failed to fetch unread notifications count:', response.status);
        }
        return 0;
      }
    } catch (error) {
      // Silently handle network errors - this is expected until backend is ready
      console.log('ℹ️ Backend notifications service not available yet - using local notifications');
      return 0;
    }
  }

  /**
   * Send local notification
   */
  async sendLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    if (!notificationsEnabled()) return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          ...(Platform.OS === 'android'
            ? { android: { channelId: ANDROID_VEHICLE_NOTIFICATION_CHANNEL_ID } }
            : {}),
        },
        trigger: null, // Send immediately
      });
      console.log('✅ Local notification sent');
    } catch (error) {
      console.error('❌ Error sending local notification:', error);
    }
  }

  /**
   * Send vehicle requested notification
   */
  async sendVehicleRequestedNotification(
    plate: string,
    establishmentName: string,
    establishmentId: string
  ): Promise<void> {
    await this.sendLocalNotification(
      '🚗 Vehículo Solicitado',
      `Vehículo ${plate} solicitado en ${establishmentName}`,
      {
        type: 'vehicle_requested',
        plate,
        establishmentName,
        establishmentId,
        timestamp: new Date().toISOString(),
      }
    );
  }

  /**
   * Get device token for backend registration
   */
  getDeviceToken(): string | null {
    return this.deviceToken;
  }

  /**
   * Register device with backend
   */
  async registerDevice(establishmentId: string, userId?: string): Promise<boolean> {
    if (!notificationsEnabled()) return false;
    try {
      if (!this.deviceToken) {
        console.log('❌ No device token available');
        return false;
      }

      if (!this.deviceToken.startsWith('ExponentPushToken[')) {
        console.warn('⚠️ Token no tiene formato Expo válido:', this.deviceToken.substring(0, 32));
        return false;
      }

      console.log(`📱 Registering device for establishment ${establishmentId}`);

      const response = await apiClient.registerNotificationDevice({
        deviceToken: this.deviceToken,
        establishmentId,
        userId,
        platform: Platform.OS,
      });

      if (!response.success) {
        const err = response.error || response.message || 'unknown';
        if (/404|Cannot POST|not found/i.test(String(err))) {
          console.warn(
            '⚠️ Backend /notifications/register-device no disponible (404). Deploy pendiente en carman-back.'
          );
        } else if (/401|sesión|unauthorized/i.test(String(err))) {
          console.warn('⚠️ Registro de dispositivo falló por autenticación (401):', err);
        } else {
          console.warn('⚠️ No se pudo registrar el dispositivo:', err);
        }
        return false;
      }

      console.log('✅ Device registered successfully');
      return true;
    } catch (error) {
      console.error('❌ Error registering device:', error);
      return false;
    }
  }

  /**
   * Deja de enviar push a este dispositivo. Se llama con la sesión todavía activa.
   */
  async unregisterDevice(): Promise<void> {
    if (!notificationsEnabled()) return;
    try {
      const response = await apiClient.unregisterNotificationDevice({
        deviceToken: this.deviceToken,
      });
      if (!response.success) {
        console.warn('⚠️ No se pudo desregistrar el dispositivo:', response.error || response.message);
        return;
      }
      console.log('✅ Device unregistered');
    } catch (error) {
      console.warn('⚠️ Error desregistrando dispositivo:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    if (!notificationsEnabled()) return;
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<Notifications.NotificationPermissionsStatus> {
    return await Notifications.getPermissionsAsync();
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: {
    allowAlert?: boolean;
    allowBadge?: boolean;
    allowSound?: boolean;
  }): Promise<boolean> {
    if (!notificationsEnabled()) return false;
    try {
      const { status } = await Notifications.requestPermissionsAsync(settings);
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error updating notification settings:', error);
      return false;
    }
  }
}

export const notificationService = NotificationService.getInstance();