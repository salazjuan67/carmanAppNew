import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Vehicle } from '../types/vehicle';
import { NOTIFICATIONS_CONFIG } from '../config/constants';

interface NotificationItem {
  id: string;
  vehicleId: string;
  patente: string;
  establishmentId: string;
  establishmentName: string;
  timestamp: Date;
  isRead: boolean;
  type: 'vehicle_requested';
}

export const useLocalNotifications = (currentEstablishmentId?: string) => {
  const enabled =
    NOTIFICATIONS_CONFIG.ENABLED &&
    ((Platform.OS === 'ios' && NOTIFICATIONS_CONFIG.IOS_ENABLED) ||
      (Platform.OS === 'android' && NOTIFICATIONS_CONFIG.ANDROID_ENABLED));
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const filteredNotifications = enabled
    ? notifications.filter(
        (notification) =>
          !currentEstablishmentId || notification.establishmentId === currentEstablishmentId
      )
    : [];

  const filteredUnreadCount = enabled
    ? filteredNotifications.filter((n) => !n.isRead).length
    : 0;

  const addVehicleRequestedNotification = useCallback(
    (vehicle: Vehicle) => {
      if (!enabled) return;

      const notification: NotificationItem = {
        id: `vehicle_requested_${vehicle._id}_${Date.now()}`,
        vehicleId: vehicle._id,
        patente: vehicle.patente,
        establishmentId: vehicle.establecimiento?._id || '',
        establishmentName: vehicle.establecimiento?.nombre || 'Establecimiento',
        timestamp: new Date(),
        isRead: false,
        type: 'vehicle_requested',
      };

      setNotifications((prev) => [notification, ...prev]);
    },
    [enabled]
  );

  const markAsRead = useCallback(
    (notificationId: string) => {
      if (!enabled) return;
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification
        )
      );
    },
    [enabled]
  );

  const markAllAsRead = useCallback(() => {
    if (!enabled || !currentEstablishmentId) return;

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.establishmentId === currentEstablishmentId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, [currentEstablishmentId, enabled]);

  const clearAllNotifications = useCallback(() => {
    if (!enabled) return;
    setNotifications([]);
  }, [enabled]);

  const clearEstablishmentNotifications = useCallback(() => {
    if (!enabled || !currentEstablishmentId) return;

    setNotifications((prev) =>
      prev.filter((notification) => notification.establishmentId !== currentEstablishmentId)
    );
  }, [currentEstablishmentId, enabled]);

  const clearOldNotifications = useCallback(() => {
    if (!enabled) return;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    setNotifications((prev) => prev.filter((notification) => notification.timestamp > oneDayAgo));
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      clearOldNotifications();
    }
  }, [clearOldNotifications, enabled]);

  return {
    notifications: filteredNotifications,
    unreadCount: filteredUnreadCount,
    addVehicleRequestedNotification,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    clearEstablishmentNotifications,
    clearOldNotifications,
  };
};
