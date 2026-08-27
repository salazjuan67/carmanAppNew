import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';

interface PermissionPromptProps {
  onRequestPermission: () => Promise<boolean>;
  onDismiss: () => void;
}

export const PermissionPrompt: React.FC<PermissionPromptProps> = ({
  onRequestPermission,
  onDismiss
}) => {
  const { t } = useLanguage();

  const handleRequestPermission = async () => {
    try {
      const granted = await onRequestPermission();
      if (granted) {
        Alert.alert(
          '✅ Permisos otorgados',
          'Ahora recibirás notificaciones cuando se soliciten vehículos.',
          [{ text: 'OK', onPress: onDismiss }]
        );
      } else {
        Alert.alert(
          '❌ Permisos denegados',
          'Puedes activar las notificaciones más tarde en la configuración de la app.',
          [{ text: 'OK', onPress: onDismiss }]
        );
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🔔 Notificaciones</Text>
        <Text style={styles.message}>
          Recibe notificaciones cuando se soliciten vehículos en tu establecimiento.
        </Text>
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onDismiss}>
            <Text style={styles.cancelText}>Ahora no</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.allowButton} onPress={handleRequestPermission}>
            <Text style={styles.allowText}>Permitir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.lg,
    maxWidth: 300,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.darkBlue,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    fontSize: typography.sizes.md,
    color: colors.darkGrey,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.lightGrey,
  },
  cancelText: {
    textAlign: 'center',
    color: colors.darkGrey,
    fontWeight: typography.weights.medium,
  },
  allowButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.darkBlue,
  },
  allowText: {
    textAlign: 'center',
    color: colors.white,
    fontWeight: typography.weights.medium,
  },
});

