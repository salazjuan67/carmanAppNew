import { useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { notificationService } from '../services/notificationService';
import { oneSignalService } from '../services/oneSignalService';
import { useAppStore } from '../store/appStore';

export const useNotifications = () => {
  const { establishment, user } = useAppStore();
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const initializeNotifications = async () => {
      try {
        const expoSuccess = await notificationService.initialize();
        if (expoSuccess) {
          console.log('✅ Expo notifications initialized successfully');
        }
      } catch (e) {
        console.warn('Expo notifications init failed:', e);
      }

      if (cancelled) return;

      try {
        const oneSignalSuccess = await oneSignalService.initialize();
        if (oneSignalSuccess) {
          console.log('✅ OneSignal initialized successfully');
          const hasPermission = await oneSignalService.checkPermissionStatus();
          if (!cancelled) setPermissionGranted(hasPermission);
        } else {
          console.log('ℹ️ OneSignal not available on this platform/build');
        }
      } catch (e) {
        console.warn('OneSignal init failed (non-fatal):', e);
      }
    };

    const interaction = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => {
        void initializeNotifications();
      }, 2500);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      interaction.cancel?.();
    };
  }, []);

  useEffect(() => {
    if (establishment?._id) {
      notificationService.registerDevice(establishment._id, user?._id);
      
      // Set OneSignal user tags
      oneSignalService.setUserTags({
        establishment_id: establishment._id,
        establishment_name: establishment.nombre,
        user_id: user?._id || 'anonymous',
      });
    }
  }, [establishment, user]);

  const requestPermission = async (): Promise<boolean> => {
    // Use the new method with user response
    const granted = await oneSignalService.promptForPushNotificationsWithUserResponse();
    setPermissionGranted(granted);
    return granted;
  };

  return {
    // Expo notifications
    sendVehicleRequestedNotification: notificationService.sendVehicleRequestedNotification.bind(notificationService),
    getDeviceToken: notificationService.getDeviceToken.bind(notificationService),
    registerDevice: notificationService.registerDevice.bind(notificationService),
    clearAllNotifications: notificationService.clearAllNotifications.bind(notificationService),
    getNotificationSettings: notificationService.getNotificationSettings.bind(notificationService),
    updateNotificationSettings: notificationService.updateNotificationSettings.bind(notificationService),
    
    // OneSignal methods
    setUserTags: oneSignalService.setUserTags.bind(oneSignalService),
    getUserId: oneSignalService.getUserId.bind(oneSignalService),
    getDeviceState: oneSignalService.getDeviceState.bind(oneSignalService),
    requestPermission,
    permissionGranted,
    shouldShowPermissionPrompt: oneSignalService.shouldShowPermissionPrompt.bind(oneSignalService),
  };
};
