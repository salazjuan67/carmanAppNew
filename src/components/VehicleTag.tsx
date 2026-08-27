import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { VehicleState } from '../types/vehicle';
import { colors, spacing, borderRadius, typography } from '../config/theme';

/** Colores de tab activo (spec rediseño Home) */
const LAYER_ACCENTS = {
  red: {
    active: colors.error[500],
    border: colors.error[600],
    bg: colors.error[100],
    bgMuted: colors.error[50],
  },
  yellow: {
    active: '#F59E0B',
    border: '#D97706',
    bg: '#FEF3C7',
    bgMuted: '#FFFBEB',
  },
  green: {
    active: '#10B981',
    border: '#059669',
    bg: '#D1FAE5',
    bgMuted: '#ECFDF5',
  },
} as const;

export type TagLayer = 'red' | 'yellow' | 'green';

interface VehicleTagProps {
  state: VehicleState;
  layer: TagLayer;
  displayText?: string;
  quantity: number;
  onPress: () => void;
  selected: boolean;
}

export const VehicleTag: React.FC<VehicleTagProps> = ({
  state: _state,
  layer,
  displayText,
  quantity,
  onPress,
  selected,
}) => {
  const scale = useRef(new Animated.Value(selected ? 1.06 : 1)).current;
  const accent = LAYER_ACCENTS[layer];

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1.06 : 1,
      friction: 7,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [selected, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.tag,
          {
            backgroundColor: selected ? accent.bg : accent.bgMuted,
            borderColor: selected ? accent.border : colors.secondary[200],
            borderWidth: selected ? 3 : 1,
            opacity: pressed ? 0.92 : 1,
            shadowOpacity: selected ? 0.22 : 0.08,
            elevation: selected ? 6 : 2,
          },
        ]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.displayText,
            selected && { color: colors.black, fontWeight: typography.weights.bold },
          ]}
        >
          {displayText ?? String(_state)}
        </Text>
        <Text style={[styles.quantityText, selected && { color: accent.border }]}>{quantity ?? 0}</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tag: {
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  displayText: {
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.secondary[700],
    marginBottom: 4,
  },
  quantityText: {
    fontSize: 22,
    fontWeight: typography.weights.bold,
    color: colors.secondary[800],
  },
});
