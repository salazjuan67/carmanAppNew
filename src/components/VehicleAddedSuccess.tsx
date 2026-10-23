import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle, X } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { Vehicle } from '../types/vehicle';
import { generateWhatsAppQR } from '../utils/formatters';
import { AnimatedQRCode } from './AnimatedQRCode';
import { useLanguage } from '../contexts/LanguageContext';

interface VehicleAddedSuccessProps {
  vehicle: Vehicle;
  onClose: () => void;
}

/**
 * Pantalla completa (Modal) para que el QR quede visible y se pueda scrollear en teléfonos chicos;
 * antes era un overlay dentro del formulario y el QR quedaba cortado debajo del encabezado.
 */
export const VehicleAddedSuccess: React.FC<VehicleAddedSuccessProps> = ({ vehicle, onClose }) => {
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // El borde animado suma 60px al QR; que entre en la tarjeta con margen.
  const qrSize = Math.round(Math.min(Math.max(width - 160, 180), 260));

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <CheckCircle size={26} color={colors.success[600]} />
                <Text style={styles.title}>{t('vehicleAddedSuccess')}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Cerrar"
              >
                <X size={22} color={colors.darkGrey} />
              </TouchableOpacity>
            </View>

            <Text style={styles.plate}>{vehicle.patente}</Text>
            <View style={styles.chips}>
              <View style={styles.chip}>
                <Text style={styles.chipLabel}>{t('sector')}</Text>
                <Text style={styles.chipValue}>{vehicle.sector}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipLabel}>{t('key')}</Text>
                <Text style={styles.chipValue}>{vehicle.nroLlave || 0}</Text>
              </View>
            </View>

            <View style={styles.qrSection}>
              <AnimatedQRCode
                value={generateWhatsAppQR(vehicle)}
                vehicle={vehicle}
                size={qrSize}
                backgroundColor="white"
                color="black"
              />
              <Text style={styles.qrHint}>{t('scanToRequest')}</Text>
            </View>

            <TouchableOpacity style={styles.continueButton} onPress={onClose}>
              <Text style={styles.continueButtonText}>{t('continue')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    maxWidth: 420,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    flexShrink: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.darkBlue,
  },
  closeButton: {
    padding: spacing.xs,
  },
  plate: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.darkBlue,
    textAlign: 'center',
    letterSpacing: 1,
  },
  chips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.greyBackground,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipLabel: {
    fontSize: typography.sizes.sm,
    color: colors.darkGrey,
  },
  chipValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.black,
  },
  qrSection: {
    alignItems: 'center',
  },
  qrHint: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.darkGrey,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: colors.darkBlue,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});
