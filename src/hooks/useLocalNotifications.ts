import { useState, useEffect, useCallback } from 'react';
import { Vehicle } from '../types/vehicle';

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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Debug logs
  console.log('🔔 useLocalNotifications - currentEstablishmentId:', currentEstablishmentId);
  console.log('🔔 useLocalNotifications - notifications count:', notifications.length);

  // Filter notifications by current establishment
  const filteredNotifications = notifications.filter(notification => 
    !currentEstablishmentId || notification.establishmentId === currentEstablishmentId
  );

  const filteredUnreadCount = filteredNotifications.filter(n => !n.isRead).length;

  // Add a new notification when a vehicle is requested
  const addVehicleRequestedNotification = useCallback((vehicle: Vehicle) => {
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

    setNotifications(prev => [notification, ...prev]);
    console.log('🔔 Local notification added:', notification);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read (only for current establishment)
  const markAllAsRead = useCallback(() => {
    if (!currentEstablishmentId) return;
    
    setNotifications(prev => 
      prev.map(notification => 
        notification.establishmentId === currentEstablishmentId
          ? { ...notification, isRead: true }
          : notification
      )
    );
  }, [currentEstablishmentId]);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Clear notifications for current establishment only
  const clearEstablishmentNotifications = useCallback(() => {
    if (!currentEstablishmentId) return;
    
    setNotifications(prev => 
      prev.filter(notification => notification.establishmentId !== currentEstablishmentId)
    );
  }, [currentEstablishmentId]);

  // Clear old notifications (older than 24 hours)
  const clearOldNotifications = useCallback(() => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    setNotifications(prev => 
      prev.filter(notification => notification.timestamp > oneDayAgo)
    );
  }, []);

  // Update unread count when notifications change
  useEffect(() => {
    setUnreadCount(filteredUnreadCount);
  }, [filteredUnreadCount]);

  // Clear old notifications on mount
  useEffect(() => {
    clearOldNotifications();
  }, [clearOldNotifications]);

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
