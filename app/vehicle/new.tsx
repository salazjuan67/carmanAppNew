import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { X, Car } from 'lucide-react-native';
import { VehicleForm } from '../../src/components/VehicleForm';
import { ModernHeader } from '../../src/components/ModernHeader';
import { useEstablishmentStore } from '../../src/store/establishmentStore';
import { getEstablishmentShift } from '../../src/services/shiftServiceNew';
import { colors, spacing, typography, borderRadius } from '../../src/config/theme';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function NewVehicleScreen() {
  const { t } = useLanguage();
  const selectedEstablishment = useEstablishmentStore((state) => state.selectedEstablishment);
  const establishmentId = selectedEstablishment?._id;
  const { data: shift, isLoading: shiftLoading } = useQuery({
    queryKey: ['shift', establishmentId],
    queryFn: () => getEstablishmentShift(establishmentId!),
    enabled: !!establishmentId,
    staleTime: 0,
  });

  console.log('🚗 NewVehicleScreen - selectedEstablishment:', selectedEstablishment);

  if (!selectedEstablishment) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color="black" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {t('noEstablishmentSelected')}
          </Text>
          <Text style={styles.errorSubtext}>
            {t('selectEstablishmentMessage')}
          </Text>
          <TouchableOpacity 
            style={styles.backToHomeButton}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.backToHomeButtonText}>{t('backToHome')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (shiftLoading) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (!shift?._id) {
    return (
      <View style={styles.container}>
        <ModernHeader
          title={t('newVehicle')}
          subtitle={`${t('establishment')}: ${selectedEstablishment.nombre}`}
          icon={<Car size={24} color={colors.primary[600]} />}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{t('noActiveShiftTitle')}</Text>
          <Text style={styles.errorSubtext}>{t('noActiveShiftMessage')}</Text>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => router.push('/home')}
          >
            <Text style={styles.backToHomeButtonText}>{t('goManageShifts')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('newVehicle')}
        subtitle={`${t('establishment')}: ${selectedEstablishment.nombre}`}
        icon={<Car size={24} color={colors.primary[600]} />}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <VehicleForm
            establishmentId={selectedEstablishment._id}
            embedded={true}
            onSuccess={() => router.back()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.greyBackground, // Mantener el fondo gris claro como la app vieja
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.greyBackground,
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.darkGrey,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.red,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  errorSubtext: {
    fontSize: typography.sizes.base,
    color: colors.darkGrey,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backToHomeButton: {
    backgroundColor: colors.darkBlue,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: 40, // Extra margin para evitar superposición con barra de navegación
  },
  backToHomeButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});
