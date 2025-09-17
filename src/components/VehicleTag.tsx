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
  const scale = selected ? 1.05 : 1;
  const opacity = selected ? 1 : 0.8;

  return (
    <Pressable
      style={[
        styles.tag,
        { 
          backgroundColor,
          transform: [{ scale }],
          opacity,
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
      return '#EF4444'; // Rojo vibrante
    case 'EN CAMINO':
    case 'SOLICITADO':
      return '#F59E0B'; // Amarillo vibrante
    case 'ENTREGADO':
    case 'FACTURADO':
      return '#10B981'; // Verde vibrante
    default:
      return '#6B7280'; // Gris
  }
};

const styles = StyleSheet.create({
  tag: {
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  displayText: {
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.white,
    marginBottom: 2,
  },
  quantityText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});
