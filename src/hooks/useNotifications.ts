import { useCallback, useEffect, useState } from 'react';
import { AppState, InteractionManager, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notificationService';
import { NOTIFICATIONS_CONFIG } from '../config/constants';

export const useNotifications = (establishmentId?: string, userId?: string) => {
  const enabled =
    NOTIFICATIONS_CONFIG.ENABLED &&
    ((Platform.OS === 'ios' && NOTIFICATIONS_CONFIG.IOS_ENABLED) ||
      (Platform.OS === 'android' && NOTIFICATIONS_CONFIG.ANDROID_ENABLED));
  const [permissionGranted, setPermissionGranted] = useState(false);

  const registerDevice = useCallback(async () => {
    if (!enabled || !Device.isDevice || !establishmentId) {
      return;
    }
    if (!notificationService.getDeviceToken()) {
      console.log('ℹ️ Sin Expo push token aún; se reintentará tras permiso/init');
      return;
    }
    const ok = await notificationService.registerDevice(establishmentId, userId);
    if (ok) {
      console.log('✅ Dispositivo registrado en backend para', establishmentId);
    }
  }, [enabled, establishmentId, userId]);

  const initializeAndRegister = useCallback(async () => {
    if (!enabled || !Device.isDevice) return;
    console.log('📱 Inicializando Expo Notifications…');
    const initialized = await notificationService.initialize();
    if (initialized) {
      await registerDevice();
    } else {
      console.warn('⚠️ Expo Notifications no inicializó (permiso o dispositivo)');
    }
  }, [enabled, registerDevice]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const interaction = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        await initializeAndRegister();
        if (cancelled) return;

        const status = await notificationService.getNotificationSettings();
        setPermissionGranted(status.status === 'granted');
      })();
    });
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void initializeAndRegister();
      }
    });
    const tokenSubscription = Notifications.addPushTokenListener(() => {
      void initializeAndRegister();
    });

    return () => {
      cancelled = true;
      interaction.cancel?.();
      appStateSubscription.remove();
      tokenSubscription.remove();
    };
  }, [enabled, initializeAndRegister]);

  useEffect(() => {
    void registerDevice();
  }, [registerDevice, permissionGranted]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false;

    try {
      const current = await Notifications.getPermissionsAsync();
      const result =
        current.status === 'granted'
          ? current
          : await Notifications.requestPermissionsAsync();
      const granted = result.status === 'granted';
      setPermissionGranted(granted);

      if (granted) {
        await initializeAndRegister();
      }
      return granted;
    } catch (error) {
      console.warn('⚠️ No se pudo solicitar permiso de notificaciones:', error);
      return false;
    }
  }, [enabled, initializeAndRegister]);

  const shouldShowPermissionPrompt = useCallback(
    () => enabled && !permissionGranted,
    [enabled, permissionGranted]
  );

  return {
    sendVehicleRequestedNotification:
      notificationService.sendVehicleRequestedNotification.bind(notificationService),
    getDeviceToken: notificationService.getDeviceToken.bind(notificationService),
    registerDevice,
    clearAllNotifications: notificationService.clearAllNotifications.bind(notificationService),
    getNotificationSettings: notificationService.getNotificationSettings.bind(notificationService),
    updateNotificationSettings:
      notificationService.updateNotificationSettings.bind(notificationService),
    requestPermission,
    permissionGranted,
    shouldShowPermissionPrompt,
  };
};
