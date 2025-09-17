import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { VehicleState } from '../types/vehicle';
import { colors, spacing, borderRadius, typography } from '../config/theme';

interface VehicleTagProps {
  state: VehicleState;
  displayText?: string;
  quantity: number;
  onPress: () => void;
  selected: boolean;
}

export const VehicleTag: React.FC<VehicleTagProps> = ({ 
  state, 
  displayText, 
  quantity, 
  onPress, 
  selected 
}) => {
  const backgroundColor = getStateColor(state);
  const scale = selected ? 1.2 : 1;

  return (
    <Pressable
      style={[
        styles.tag,
        { 
          backgroundColor,
          transform: [{ scale }],
        }
      ]}
      onPress={onPress}
    >
      <Text style={styles.displayText}>{displayText || state}</Text>
      <Text style={styles.quantityText}>{quantity ?? 0}</Text>
    </Pressable>
  );
};

const getStateColor = (estado: string): string => {
  switch (estado) {
    case 'ESTACIONADO':
    case 'INGRESADO':
      return colors.error[200]; // Rojo claro
    case 'EN CAMINO':
    case 'SOLICITADO':
      return colors.warning[200]; // Amarillo claro
    case 'ENTREGADO':
    case 'FACTURADO':
      return colors.success[200]; // Verde claro
    default:
      return colors.secondary[200]; // Gris claro
  }
};

const styles = StyleSheet.create({
  tag: {
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginHorizontal: spacing.xs,
  },
  displayText: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
  quantityText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.black,
  },
});
