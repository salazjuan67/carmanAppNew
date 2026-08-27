import { API_ENDPOINTS, API_CONFIG } from '../config/constants';

export interface StateChangeNotification {
  vehicleId: string;
  patente: string;
  establishmentId: string;
  previousState: string;
  newState: string;
  timestamp: string;
}

export class StateChangeNotificationService {
  private static instance: StateChangeNotificationService;

  static getInstance(): StateChangeNotificationService {
    if (!StateChangeNotificationService.instance) {
      StateChangeNotificationService.instance = new StateChangeNotificationService();
    }
    return StateChangeNotificationService.instance;
  }

  /**
   * Notify backend about state change so it can send OneSignal push notification
   */
  async notifyStateChange(notification: StateChangeNotification): Promise<boolean> {
    try {
      console.log('📡 Notifying backend about state change:', notification);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.STATE_CHANGE_NOTIFICATION}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      });

      if (response.ok) {
        console.log('✅ Backend notified successfully');
        return true;
      } else {
        // Silently handle 404 (endpoint not implemented) and other errors
        if (response.status === 404) {
          console.log('ℹ️ Backend endpoint not implemented yet - notifications will work once backend is ready');
        } else {
          console.log('⚠️ Backend notification failed:', response.status);
        }
        return false;
      }
    } catch (error) {
      // Silently handle network errors - this is expected until backend is ready
      console.log('ℹ️ Backend notification service not available yet - will work once backend endpoint is implemented');
      return false;
    }
  }
}

export const stateChangeNotificationService = StateChangeNotificationService.getInstance();