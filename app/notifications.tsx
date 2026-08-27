import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Trash2, Check } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography } from '../src/config/theme';
import { useLocalNotifications } from '../src/hooks/useLocalNotifications';
import { useLanguage } from '../src/contexts/LanguageContext';
import { useEstablishmentStore } from '../src/store/establishmentStore';
import { dateFormat } from '../src/utils/formatters';

export default function NotificationsScreen() {
  const { t } = useLanguage();
  const { selectedEstablishment } = useEstablishmentStore();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearEstablishmentNotifications,
    addVehicleRequestedNotification
  } = useLocalNotifications(selectedEstablishment?._id);

  // Debug logs
  console.log('🔔 NotificationsScreen - selectedEstablishment:', selectedEstablishment?._id);
  console.log('🔔 NotificationsScreen - notifications count:', notifications.length);
  console.log('🔔 NotificationsScreen - unreadCount:', unreadCount);

  const handleBack = () => {
    router.back();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    Alert.alert(
      t('clearNotifications'),
      t('clearNotificationsMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('clear'), 
          style: 'destructive',
          onPress: clearEstablishmentNotifications 
        }
      ]
    );
  };

  const handleNotificationPress = (notificationId: string) => {
    markAsRead(notificationId);
    // Navigate to vehicle details if needed
    // router.push(`/vehicle/details/${vehicleId}`);
  };

  // Función de prueba para agregar una notificación
  const addTestNotification = () => {
    const testVehicle = {
      _id: 'test_' + Date.now(),
      patente: 'TEST123',
      establecimiento: {
        _id: selectedEstablishment?._id || 'test_establishment',
        nombre: selectedEstablishment?.nombre || 'Test Establishment'
      }
    };
    
    addVehicleRequestedNotification(testVehicle as any);
  };

  const renderNotification = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item.id)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>
            {t('vehicleRequested')}
          </Text>
          <Text style={styles.notificationTime}>
            {dateFormat(item.timestamp, 'HH:mm')}
          </Text>
        </View>
        <Text style={styles.notificationText}>
          {t('vehicleRequestedMessage', { 
            patente: item.patente,
            establishment: item.establishmentName 
          })}
        </Text>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('notifications')}</Text>
          {selectedEstablishment && (
            <Text style={styles.establishmentName}>{selectedEstablishment.nombre}</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.actionButton}>
              <Check size={20} color="white" />
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll} style={styles.actionButton}>
              <Trash2 size={20} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>{t('noNotifications')}</Text>
            <Text style={styles.emptyStateText}>
              {selectedEstablishment 
                ? `${t('noNotificationsMessage')} en ${selectedEstablishment.nombre}.`
                : t('noNotificationsMessage')
              }
            </Text>
            <TouchableOpacity 
              style={styles.testButton}
              onPress={addTestNotification}
            >
              <Text style={styles.testButtonText}>Agregar Notificación de Prueba</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.notificationsList}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBlue,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.darkBlue,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  establishmentName: {
    fontSize: typography.sizes.sm,
    color: colors.lightGrey,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    paddingTop: spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.darkGrey,
    marginBottom: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.sizes.base,
    color: colors.lightGrey,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationsList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  notificationItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
    position: 'relative',
  },
  unreadNotification: {
    borderColor: colors.darkBlue,
    borderWidth: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  notificationTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.darkBlue,
  },
  notificationTime: {
    fontSize: typography.sizes.sm,
    color: colors.lightGrey,
  },
  notificationText: {
    fontSize: typography.sizes.base,
    color: colors.darkGrey,
    lineHeight: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  testButton: {
    backgroundColor: colors.darkBlue,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  testButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
});