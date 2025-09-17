import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NOTIFICATION_CONFIG } from '../config/constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private deviceToken: string | null = null;

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
    try {
      console.log('🔔 Initializing notification service...');

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Notification permission not granted');
        return false;
      }

      // Get device token
      if (Platform.OS !== 'web') {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'b6860274-7285-4382-83d0-2c63a93ca0fb',
        });
        this.deviceToken = token.data;
        console.log('✅ Device token obtained:', this.deviceToken?.substring(0, 20) + '...');
      }

      // Setup notification listeners
      this.setupNotificationListeners();

      console.log('✅ Notification service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing notification service:', error);
      return false;
    }
  }

  /**
   * Setup notification event listeners
   */
  private setupNotificationListeners() {
    // Listener for notification received
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('📱 Notification received:', notification);
    });

    // Listener for notification tapped
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('📱 Notification tapped:', response);
      // Handle navigation based on notification data
      this.handleNotificationTap(response);
    });
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data;
    
    if (data?.type === 'vehicle_requested') {
      // Navigate to vehicle details or notification screen
      console.log('🚗 Vehicle requested notification tapped');
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
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
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
    try {
      if (!this.deviceToken) {
        console.log('❌ No device token available');
        return false;
      }

      console.log(`📱 Registering device for establishment ${establishmentId}`);
      
      // TODO: Implement backend registration
      // const response = await api.post('/notifications/register-device', {
      //   deviceToken: this.deviceToken,
      //   establishmentId,
      //   userId,
      //   platform: Platform.OS,
      // });

      console.log('✅ Device registered successfully');
      return true;
    } catch (error) {
      console.error('❌ Error registering device:', error);
      return false;
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
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
