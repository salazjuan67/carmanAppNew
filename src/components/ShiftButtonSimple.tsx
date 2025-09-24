import React, { useState, useEffect } from 'react';
import { Pressable, Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
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
  const [showDialog, setShowDialog] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftState | null>(null);
  
  const { mutateAsync: addShift, isPending: addShiftLoading } = useAddShift();
  const { mutateAsync: endShift, isPending: endShiftLoading } = useEndShift();
  const setShift = useShiftStore((state) => state.setShift);

  // Solo consultar el turno del establecimiento actual
  const { data: shift, isLoading, refetch } = useQuery({
    queryKey: ['shift', establishmentId],
    queryFn: () => getEstablishmentShift(establishmentId),
    enabled: !!establishmentId,
    staleTime: 0, // Cambiar a 0 para que siempre refresque
  });

  // Actualizar el store cuando cambie el turno
  useEffect(() => {
    setShift(shift || null);
  }, [shift, setShift]);

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
      // Refrescar la query para obtener el nuevo turno
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
      // Refrescar la query para obtener el estado actualizado
      refetch();
    } catch (e) {
      console.error('❌ Error ending shift:', e);
    }
  };

  // Log para debugging
  console.log('🔄 ShiftButtonSimple - establishmentId:', establishmentId);
  console.log('🔄 ShiftButtonSimple - shift:', shift);
  console.log('🔄 ShiftButtonSimple - isLoading:', isLoading);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.spinner} />
      </View>
    );
  }

  if (!!shift) {
    return (
      <>
        <Pressable
          style={styles.button}
          onPress={() => setShowDialog(true)}
        >
          <LockKeyhole size={20} color="white" />
        </Pressable>
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDialog}
          onRequestClose={() => setShowDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('endShift')}</Text>
              <Text style={styles.modalText}>
                {t('confirmEndShift')}{' '}
                <Text style={styles.boldText}>{shift.nombre}</Text>?
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
      </>
    );
  } else {
    return (
      <>
        <Pressable
          style={styles.button}
          onPress={() => setShowStartModal(true)}
        >
          <LockKeyholeOpen size={20} color="white" />
        </Pressable>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showStartModal}
          onRequestClose={() => setShowStartModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('startShift')}</Text>
              <Text style={styles.modalSubtitle}>{t('selectShift')}</Text>
              
              <View style={styles.shiftOptions}>
                {SHIFT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.shiftOption,
                      selectedShift === option.value && styles.selectedShiftOption
                    ]}
                    onPress={() => setSelectedShift(option.value as ShiftState)}
                  >
                    <Text style={[
                      styles.shiftOptionText,
                      selectedShift === option.value && styles.selectedShiftOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
                    (!selectedShift || addShiftLoading) && styles.disabledButton
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
      </>
    );
  }
};

const styles = StyleSheet.create({
  loadingContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  spinner: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderColor: colors.primary[500],
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
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
  shiftOptions: {
    marginBottom: spacing.lg,
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
