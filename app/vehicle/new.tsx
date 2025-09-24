import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, Car } from 'lucide-react-native';
import { VehicleForm } from '../../src/components/VehicleForm';
import { ModernHeader } from '../../src/components/ModernHeader';
import { useEstablishmentStore } from '../../src/store/establishmentStore';
import { colors, spacing, typography, borderRadius } from '../../src/config/theme';
import { useLanguage } from '../../src/contexts/LanguageContext';

export default function NewVehicleScreen() {
  const { t } = useLanguage();
  const selectedEstablishment = useEstablishmentStore((state) => state.selectedEstablishment);

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

  return (
    <View style={styles.container}>
      <ModernHeader
        title={t('newVehicle')}
        subtitle={`${t('establishment')}: ${selectedEstablishment.nombre}`}
        icon={<Car size={24} color={colors.primary[600]} />}
      />
        
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <VehicleForm 
            establishmentId={selectedEstablishment._id}
            embedded={true}
            onSuccess={() => {
              // Navegar de vuelta a la pantalla anterior (home)
              router.back();
            }}
          />
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.greyBackground, // Mantener el fondo gris claro como la app vieja
  },
  keyboardContainer: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    paddingBottom: 20,
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
  },
  backToHomeButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});
