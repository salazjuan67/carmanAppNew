import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert } from 'react-native';
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react-native';
import { useShift } from '../hooks/useShift';
import { ShiftState, SHIFT_OPTIONS } from '../types/shift';
import { colors, spacing, typography, borderRadius } from '../config/theme';

interface ShiftButtonProps {
  establishmentId: string;
}

export const ShiftButton: React.FC<ShiftButtonProps> = ({ establishmentId }) => {
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<ShiftState | null>(null);
  
  const { shift, loading, startShift, endShift } = useShift(establishmentId);

  const handleStartShift = async () => {
    if (!selectedShift) return;

    const success = await startShift(selectedShift);
    if (success) {
      setShowStartModal(false);
      setSelectedShift(null);
      Alert.alert('Turno iniciado', 'El turno se ha iniciado correctamente');
    } else {
      Alert.alert('Error', 'No se pudo iniciar el turno');
    }
  };

  const handleEndShift = async () => {
    const success = await endShift();
    if (success) {
      setShowEndModal(false);
      Alert.alert('Turno cerrado', 'El turno se ha cerrado correctamente');
    } else {
      Alert.alert('Error', 'No se pudo cerrar el turno');
    }
  };

  const handleCloseStartModal = () => {
    setShowStartModal(false);
    setSelectedShift(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.spinner} />
      </View>
    );
  }

  if (shift) {
    return (
      <>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowEndModal(true)}
        >
          <LockKeyhole size={20} color={colors.primary[600]} />
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={showEndModal}
          onRequestClose={() => setShowEndModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cerrar Turno</Text>
              <Text style={styles.modalText}>
                ¿Estás seguro de que quieres cerrar el turno{' '}
                <Text style={styles.boldText}>{shift.nombre}</Text>?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowEndModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleEndShift}
                >
                  <Text style={styles.confirmButtonText}>Cerrar Turno</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowStartModal(true)}
      >
        <LockKeyholeOpen size={20} color={colors.primary[600]} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showStartModal}
        onRequestClose={handleCloseStartModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Iniciar Turno</Text>
            <Text style={styles.modalSubtitle}>Seleccionar turno:</Text>
            
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
                onPress={handleCloseStartModal}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  styles.confirmButton,
                  !selectedShift && styles.disabledButton
                ]}
                onPress={handleStartShift}
                disabled={!selectedShift}
              >
                <Text style={styles.confirmButtonText}>Iniciar Turno</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
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
