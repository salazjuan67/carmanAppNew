import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAppStore } from '../store/appStore';

export const useNotifications = () => {
  const { establishment, user } = useAppStore();

  useEffect(() => {
    // Initialize notification service
    const initializeNotifications = async () => {
      const success = await notificationService.initialize();
      if (success) {
        console.log('✅ Notifications initialized successfully');
      } else {
        console.log('❌ Failed to initialize notifications');
      }
    };

    initializeNotifications();
  }, []);

  useEffect(() => {
    // Register device when establishment is selected
    if (establishment?._id) {
      notificationService.registerDevice(establishment._id, user?._id);
    }
  }, [establishment, user]);

  return {
    sendVehicleRequestedNotification: notificationService.sendVehicleRequestedNotification.bind(notificationService),
    getDeviceToken: notificationService.getDeviceToken.bind(notificationService),
    registerDevice: notificationService.registerDevice.bind(notificationService),
    clearAllNotifications: notificationService.clearAllNotifications.bind(notificationService),
    getNotificationSettings: notificationService.getNotificationSettings.bind(notificationService),
    updateNotificationSettings: notificationService.updateNotificationSettings.bind(notificationService),
  };
};
