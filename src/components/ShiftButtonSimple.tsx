import React, { useState, useEffect } from 'react';
import {
  Pressable,
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react-native';
import { getEstablishmentShift } from '../services/shiftServiceNew';
import { useAddShift } from '../hooks/useAddShift';
import { useEndShift } from '../hooks/useEndShift';
import { useShiftStore } from '../store/shiftStore';
import { ShiftState, SHIFT_OPTIONS } from '../types/shift';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';

interface ShiftButtonSimpleProps {
  establishmentId: string;
  establishmentName?: string;
}

export const ShiftButtonSimple: React.FC<ShiftButtonSimpleProps> = ({
  establishmentId,
  establishmentName,
}) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [showDialog, setShowDialog] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftState | null>(null);

  const { mutateAsync: addShift, isPending: addShiftLoading } = useAddShift();
  const { mutateAsync: endShift, isPending: endShiftLoading } = useEndShift();
  const setShift = useShiftStore((state) => state.setShift);

  const { data: shift, isLoading, refetch } = useQuery({
    queryKey: ['shift', establishmentId],
    queryFn: () => getEstablishmentShift(establishmentId),
    enabled: !!establishmentId,
    staleTime: 0,
    retry: 1,
  });

  const hasActiveShift = !!shift?._id;

  useEffect(() => {
    setShift(shift || null);
  }, [shift, setShift]);

  const overlayPaddingStyle = {
    paddingTop: Math.max(insets.top, spacing.lg) + spacing.md,
    // Immersive Android often reports bottom inset = 0; keep extra room for gesture/nav area.
    paddingBottom:
      Math.max(insets.bottom, spacing.lg) +
      (Platform.OS === 'android' ? spacing.xl : spacing.md),
    paddingHorizontal: spacing.lg,
  };

  const handleStartShift = async () => {
    if (!selectedShift || !establishmentId) return;

    const shiftName = `${new Date().toLocaleDateString('es-ES')} - ${establishmentName || 'Establecimiento'} - ${selectedShift}`;

    const body = {
      establecimiento: establishmentId,
      turno: selectedShift,
      nombre: shiftName,
    };

    try {
      console.log('🔄 Starting shift:', body);
      await addShift(body);
      console.log('✅ Shift started successfully');
      setShowStartModal(false);
      setSelectedShift(null);
      refetch();
    } catch (e) {
      console.error('❌ Error starting shift:', e);
    }
  };

  const handleEndShift = async () => {
    if (!establishmentId) return;

    try {
      console.log('🔄 Ending shift for establishment:', establishmentId);
      await endShift(establishmentId);
      console.log('✅ Shift ended successfully');
      setShowDialog(false);
      refetch();
    } catch (e) {
      console.error('❌ Error ending shift:', e);
    }
  };

  const endShiftModal = (
    <Modal
      animationType="fade"
      transparent
      visible={showDialog}
      statusBarTranslucent={Platform.OS === 'android'}
      presentationStyle="overFullScreen"
      onRequestClose={() => setShowDialog(false)}
    >
      <View style={[styles.modalOverlay, overlayPaddingStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowDialog(false)} />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('endShift')}</Text>
          <Text style={styles.modalText}>
            {`${t('confirmEndShift')} `}
            <Text style={styles.boldText}>{shift?.nombre}</Text>
            {'?'}
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowDialog(false)}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleEndShift}
              disabled={endShiftLoading}
            >
              <Text style={styles.confirmButtonText}>{t('endShift')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const startShiftModal = (
    <Modal
      animationType="fade"
      transparent
      visible={showStartModal}
      statusBarTranslucent={Platform.OS === 'android'}
      presentationStyle="overFullScreen"
      onRequestClose={() => setShowStartModal(false)}
    >
      <View style={[styles.modalOverlay, overlayPaddingStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowStartModal(false)} />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t('startShift')}</Text>
          <Text style={styles.modalSubtitle}>{t('selectShift')}</Text>

          <ScrollView
            style={styles.shiftOptionsScroll}
            contentContainerStyle={styles.shiftOptions}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {SHIFT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.shiftOption,
                  selectedShift === option.value && styles.selectedShiftOption,
                ]}
                onPress={() => setSelectedShift(option.value as ShiftState)}
              >
                <Text
                  style={[
                    styles.shiftOptionText,
                    selectedShift === option.value && styles.selectedShiftOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowStartModal(false)}
            >
              <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.confirmButton,
                (!selectedShift || addShiftLoading) && styles.disabledButton,
              ]}
              onPress={handleStartShift}
              disabled={!selectedShift || addShiftLoading}
            >
              <Text style={styles.confirmButtonText}>{t('startShift')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.spinner} />
      </View>
    );
  }

  if (hasActiveShift && shift) {
    return (
      <>
        <View style={styles.wrapper}>
          <Pressable style={styles.button} onPress={() => setShowDialog(true)}>
            <LockKeyhole size={20} color="white" />
          </Pressable>
        </View>
        {endShiftModal}
      </>
    );
  }

  return (
    <>
      <View style={styles.wrapper}>
        <Pressable style={styles.button} onPress={() => setShowStartModal(true)}>
          <LockKeyholeOpen size={20} color="white" />
        </Pressable>
      </View>
      {startShiftModal}
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: 40,
    height: 40,
  },
  loadingContainer: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  spinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.55)',
    borderTopColor: 'transparent',
    borderRadius: 8,
  },
  button: {
    width: 40,
    height: 40,
    backgroundColor: colors.darkGrey,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    zIndex: 2,
    elevation: 8,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalSubtitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.medium,
    color: colors.secondary[700],
    marginBottom: spacing.md,
  },
  modalText: {
    fontSize: typography.sizes.base,
    color: colors.secondary[700],
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  boldText: {
    fontWeight: typography.weights.bold,
  },
  shiftOptionsScroll: {
    maxHeight: 280,
    marginBottom: spacing.md,
  },
  shiftOptions: {
    paddingBottom: spacing.xs,
  },
  shiftOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondary[300],
  },
  selectedShiftOption: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[500],
  },
  shiftOptionText: {
    fontSize: typography.sizes.base,
    color: colors.secondary[700],
    textAlign: 'center',
  },
  selectedShiftOptionText: {
    color: colors.primary[700],
    fontWeight: typography.weights.semibold,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.secondary[200],
  },
  confirmButton: {
    backgroundColor: colors.primary[500],
  },
  disabledButton: {
    backgroundColor: colors.secondary[300],
  },
  cancelButtonText: {
    color: colors.secondary[700],
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});
