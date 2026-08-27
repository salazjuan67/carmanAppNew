import { Platform } from 'react-native';
import { router } from 'expo-router';
import { ONESIGNAL_CONFIG } from '../config/constants';
import { useHomeUiStore } from '../store/homeUiStore';
import { soundService } from './soundService';

/**
 * OneSignal v5 (react-native-onesignal >= 5.4) uses TurboModuleRegistry.getEnforcing.
 * Require lazily and inside try/catch so a missing native module does not kill TestFlight startup.
 */
let OneSignalMod: any = null;
let loadAttempted = false;

function loadOneSignalModule(): any | null {
  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    loadAttempted = true;
    return null;
  }
  if (loadAttempted) return OneSignalMod;
  loadAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    OneSignalMod = require('react-native-onesignal');
  } catch (error) {
    console.warn('🔔 OneSignal native module failed to load:', error);
    OneSignalMod = null;
  }
  return OneSignalMod;
}

function getOneSignal(): any | null {
  const mod = loadOneSignalModule();
  if (!mod) return null;
  return mod.OneSignal ?? mod.default ?? mod;
}

export class OneSignalService {
  private static instance: OneSignalService;
  private isInitialized = false;
  private permissionGranted = false;

  static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      // iOS uses expo-notifications + APNs only (OneSignal NSE crashed TestFlight)
      if (Platform.OS === 'web' || Platform.OS === 'ios') {
        return Platform.OS === 'web';
      }

      if (!ONESIGNAL_CONFIG.ENABLED) {
        return false;
      }

      const OneSignal = getOneSignal();
      if (!OneSignal?.initialize) {
        console.log('🔔 OneSignal.initialize not available');
        return false;
      }

      console.log(`🔔 Initializing OneSignal (${Platform.OS})...`);
      OneSignal.initialize(ONESIGNAL_CONFIG.APP_ID);
      this.setupNotificationHandlers(OneSignal);
      await this.checkPermissionStatus();
      this.isInitialized = true;
      console.log(`✅ OneSignal initialized (${Platform.OS})`);
      return true;
    } catch (error) {
      console.error('❌ Error initializing OneSignal:', error);
      return false;
    }
  }

  private setupNotificationHandlers(OneSignal: any) {
    try {
      OneSignal.Notifications?.addEventListener?.('click', (event: any) => {
        const data =
          event?.notification?.additionalData ??
          event?.result?.notification?.additionalData ??
          event?.notification?.additional_data;
        this.handleNotificationData(data);
      });

      OneSignal.Notifications?.addEventListener?.(
        'foregroundWillDisplay',
        (event: any) => {
          try {
            const notification = event?.getNotification?.() ?? event?.notification;
            const data =
              notification?.additionalData ?? notification?.additional_data;
            if (data?.type === 'vehicle_requested') {
              void soundService.playNotificationSound();
            }
            event?.preventDefault?.();
            notification?.display?.();
          } catch (e) {
            console.warn('🔔 foregroundWillDisplay handler error:', e);
          }
        }
      );
    } catch (e) {
      console.warn('🔔 Could not attach OneSignal handlers:', e);
    }
  }

  private handleNotificationData(data: any) {
    if (data?.type === 'vehicle_requested') {
      console.log('🚗 Vehicle requested notification opened → home / Solicitados');
      useHomeUiStore.getState().requestSolicitadosTabOnHome();
      router.replace('/home');
    }
  }

  async checkPermissionStatus(): Promise<boolean> {
    try {
      const OneSignal = getOneSignal();
      if (!OneSignal?.Notifications?.getPermissionAsync) {
        return this.permissionGranted;
      }
      const granted = await OneSignal.Notifications.getPermissionAsync();
      this.permissionGranted = !!granted;
      return this.permissionGranted;
    } catch (error) {
      console.error('❌ Error checking permission status:', error);
      return false;
    }
  }

  async promptForPushNotificationsWithUserResponse(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;
      const OneSignal = getOneSignal();
      if (!OneSignal?.Notifications?.requestPermission) {
        return false;
      }
      const accepted = await OneSignal.Notifications.requestPermission(true);
      this.permissionGranted = !!accepted;
      return this.permissionGranted;
    } catch (error) {
      console.error('❌ Error prompting for notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    return this.promptForPushNotificationsWithUserResponse();
  }

  shouldShowPermissionPrompt(): boolean {
    if (Platform.OS !== 'android') return false;
    if (this.permissionGranted) return false;
    return true;
  }

  async setUserTags(tags: Record<string, string>): Promise<void> {
    try {
      if (!this.isInitialized) return;
      const OneSignal = getOneSignal();
      if (!OneSignal?.User?.addTags) {
        console.log('🔔 User.addTags not available');
        return;
      }
      OneSignal.User.addTags(tags);
      console.log('✅ OneSignal tags set:', tags);
    } catch (error) {
      console.error('❌ Error setting user tags:', error);
    }
  }

  async getUserId(): Promise<string | null> {
    try {
      const OneSignal = getOneSignal();
      const id = await OneSignal?.User?.getOnesignalId?.();
      return id || null;
    } catch (error) {
      console.error('❌ Error getting user ID:', error);
      return null;
    }
  }

  async getDeviceState(): Promise<any> {
    try {
      const OneSignal = getOneSignal();
      return {
        onesignalId: await OneSignal?.User?.getOnesignalId?.(),
        hasNotificationPermission: await OneSignal?.Notifications?.getPermissionAsync?.(),
      };
    } catch (error) {
      console.error('❌ Error getting device state:', error);
      return null;
    }
  }

  async setExternalUserId(userId: string): Promise<void> {
    try {
      if (!this.isInitialized) return;
      const OneSignal = getOneSignal();
      if (!OneSignal?.login) {
        console.log('🔔 OneSignal.login not available');
        return;
      }
      OneSignal.login(userId);
      console.log('✅ OneSignal external user ID set:', userId);
    } catch (error) {
      console.error('❌ Error setting external user ID:', error);
    }
  }

  getPermissionStatus(): boolean {
    return this.permissionGranted;
  }
}

export const oneSignalService = OneSignalService.getInstance();
