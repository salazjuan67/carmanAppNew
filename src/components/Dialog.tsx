import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../config/theme';

interface DialogProps {
  showDialog: boolean;
  title: string;
  message: string;
  btnAccept: () => void;
  btnCancel?: () => void;
  acceptText?: string;
  cancelText?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  showDialog,
  title,
  message,
  btnAccept,
  btnCancel,
  acceptText = 'Aceptar',
  cancelText = 'Cancelar',
}) => {
  return (
    <Modal transparent animationType="fade" visible={showDialog}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            {btnCancel && (
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={btnCancel}>
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.button, styles.acceptButton]} onPress={btnAccept}>
              <Text style={styles.acceptButtonText}>{acceptText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    margin: spacing.lg,
    minWidth: 280,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.black,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.base,
    color: colors.darkGrey,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: colors.darkBlue,
  },
  cancelButton: {
    backgroundColor: colors.ligthGrey,
    borderWidth: 1,
    borderColor: colors.darkGrey,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
  cancelButtonText: {
    color: colors.darkGrey,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
  },
});
