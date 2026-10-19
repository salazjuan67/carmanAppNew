import { NOTIFICATIONS_CONFIG } from '../config/constants';

export interface StateChangeNotification {
  vehicleId: string;
  patente: string;
  establishmentId: string;
  previousState: string;
  newState: string;
  timestamp: string;
}

/**
 * Legacy OneSignal path. Disabled: el backend envía Expo Push al pasar a SOLICITADO.
 * No reintroducir POST /notifications/state-change desde la app.
 */
export class StateChangeNotificationService {
  private static instance: StateChangeNotificationService;

  static getInstance(): StateChangeNotificationService {
    if (!StateChangeNotificationService.instance) {
      StateChangeNotificationService.instance = new StateChangeNotificationService();
    }
    return StateChangeNotificationService.instance;
  }

  async notifyStateChange(_notification: StateChangeNotification): Promise<boolean> {
    if (__DEV__ && NOTIFICATIONS_CONFIG.ENABLED) {
      console.log('ℹ️ state-change push omitido (backend Expo Push en SOLICITADO)');
    }
    return false;
  }
}

export const stateChangeNotificationService = StateChangeNotificationService.getInstance();
