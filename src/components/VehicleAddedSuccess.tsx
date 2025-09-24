import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle, X } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { Vehicle } from '../types/vehicle';
import { generateWhatsAppQR } from '../utils/formatters';
import { AnimatedQRCode } from './AnimatedQRCode';
import { useLanguage } from '../contexts/LanguageContext';

interface VehicleAddedSuccessProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export const VehicleAddedSuccess: React.FC<VehicleAddedSuccessProps> = ({ 
  vehicle, 
  onClose 
}) => {
  const { t } = useLanguage();
  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.successIcon}>
            <CheckCircle size={32} color={colors.success[600]} />
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.darkGrey} />
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>{t('vehicleAddedSuccess')}</Text>
        
        {/* Vehicle Info */}
        <View style={styles.vehicleInfo}>
          <Text style={styles.plate}>{vehicle.patente}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('sector')}:</Text>
            <Text style={styles.infoValue}>{vehicle.sector}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('key')}:</Text>
            <Text style={styles.infoValue}>{vehicle.nroLlave || 0}</Text>
          </View>
        </View>

        {/* QR Section */}
        <View style={styles.qrSection}>
          <AnimatedQRCode 
            value={generateWhatsAppQR(vehicle)} 
            vehicle={vehicle}
            size={180} 
            backgroundColor="white"
            color="black"
          />
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButtonBottom} onPress={onClose}>
          <Text style={styles.closeButtonText}>{t('continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    margin: spacing.lg,
    maxWidth: 400,
    width: '90%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.darkBlue,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  vehicleInfo: {
    backgroundColor: colors.greyBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  plate: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.darkBlue,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.darkGrey,
  },
  infoValue: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  closeButtonBottom: {
    backgroundColor: colors.darkBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});
