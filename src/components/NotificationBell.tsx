import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../config/theme';
import { useLocalNotifications } from '../hooks/useLocalNotifications';
import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { Audio } from 'expo-av';

interface NotificationBellProps {
  onPress: () => void;
  size?: number;
  color?: string;
  establishmentId?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  onPress,
  size = 22, // Same size as old app
  color = "white",
  establishmentId
}) => {
  const { unreadCount } = useLocalNotifications(establishmentId);
  const previousCount = useRef<number>(0);

  // Query para obtener notificaciones no leídas del backend (como la app vieja)
  const { data: backendUnreadCount, refetch } = useQuery({
    queryKey: ['unread-notifications', establishmentId],
    queryFn: () => notificationService.getUnreadCount(establishmentId || ''),
    refetchInterval: 1000 * 30, // Polling cada 30 segundos como la app vieja
    enabled: !!establishmentId,
    staleTime: Infinity,
  });

  useRefreshOnFocus(refetch);

  // Función para reproducir sonido de notificación (como la app vieja)
  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
        { shouldPlay: true, volume: 0.7 }
      );
      
      setTimeout(() => {
        sound.unloadAsync();
      }, 3000);
    } catch (error) {
      console.log('Error playing notification sound:', error);
    }
  };

  // Detectar nuevas notificaciones y reproducir sonido (como la app vieja)
  useEffect(() => {
    if (backendUnreadCount !== undefined && previousCount.current !== undefined) {
      if (backendUnreadCount > previousCount.current && previousCount.current > 0) {
        // Solo reproducir sonido si hay nuevas notificaciones (no en la primera carga)
        playNotificationSound();
      }
      previousCount.current = backendUnreadCount;
    }
  }, [backendUnreadCount]);

  // Usar el conteo del backend si está disponible, sino usar el local
  const totalUnreadCount = backendUnreadCount !== undefined ? backendUnreadCount : unreadCount;

  return (
    <View style={styles.container}>
      {totalUnreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalUnreadCount > 9 ? '+9' : totalUnreadCount.toString()}
          </Text>
        </View>
      )}
      <TouchableOpacity 
        onPress={onPress} 
        style={styles.button}
        disabled={!establishmentId} // Disabled when no establishment like old app
      >
        <Bell size={size} color={color} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    backgroundColor: colors.darkGrey,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 16, // Same position as old app
    left: 12,   // Same position as old app
    zIndex: 10,
    backgroundColor: colors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
});