import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Clock, MapPin, KeySquare, Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import { Vehicle } from '../types/vehicle';
import { colors, spacing, borderRadius, typography } from '../config/theme';

interface VehicleCardProps {
  vehicle: Vehicle;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  // Get the most recent state change time or use horaIngreso
  const getDisplayHour = () => {
    if (vehicle.historialEstados && vehicle.historialEstados.length > 0) {
      const lastState = vehicle.historialEstados[vehicle.historialEstados.length - 1];
      if (lastState.fecha) {
        return new Date(lastState.fecha).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    }
    
    // Fallback to horaIngreso if it's a valid time format
    if (vehicle.horaIngreso && vehicle.horaIngreso.includes(':')) {
      return vehicle.horaIngreso;
    }
    
    return '--:--';
  };

  const displayHour = getDisplayHour();

  const handlePress = () => {
    router.push({
      pathname: '/vehicle/details',
      params: { id: vehicle._id },
    });
  };

  return (
    <Pressable
      style={[styles.card, { borderColor: getStateColor(vehicle.estado) }]}
      onPress={handlePress}
    >
      {/* Badge VIP */}
      {vehicle.vip && (
        <View style={styles.vipBadge}>
          <Crown color={colors.white} size={12} />
          <Text style={styles.vipText}>VIP</Text>
        </View>
      )}
      
      <Text style={styles.title}>{vehicle.patente}</Text>
      
      <View style={styles.row}>
        <View style={styles.item}>
          <Clock color={colors.black} size={10} />
          <Text style={styles.itemText}>{displayHour}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.item}>
          <KeySquare color={colors.black} size={10} />
          <Text style={styles.itemText}>{vehicle.nroLlave?.toString() || '--'}</Text>
        </View>
        <View style={styles.item}>
          <MapPin color={colors.black} size={10} />
          <Text style={styles.itemText}>{vehicle.sector}</Text>
        </View>
      </View>

      {vehicle.marca && (
        <Text style={styles.brandText} numberOfLines={1}>
          {typeof vehicle.marca === 'string' ? vehicle.marca : vehicle.marca.descripcion}
        </Text>
      )}

      {vehicle.modelo && (
        <Text style={styles.modelText} numberOfLines={1}>{vehicle.modelo}</Text>
      )}
      
      {vehicle.color && (
        <Text style={styles.colorText} numberOfLines={1}>{vehicle.color}</Text>
      )}
    </Pressable>
  );
};

const getStateColor = (estado: string): string => {
  switch (estado) {
    case 'ESTACIONADO':
    case 'INGRESADO':
      return colors.error[500]; // Rojo
    case 'EN CAMINO':
    case 'SOLICITADO':
      return colors.warning[500]; // Amarillo
    case 'ENTREGADO':
    case 'FACTURADO':
      return colors.success[500]; // Verde
    default:
      return colors.secondary[500]; // Gris
  }
};

const styles = StyleSheet.create({
  card: {
    gap: 4,
    margin: 3,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    paddingBottom: spacing.sm,
    width: 110,
    minHeight: 140,
    position: 'relative',
    backgroundColor: colors.white,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  title: {
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
    color: colors.black,
    marginVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemText: {
    fontSize: typography.sizes.sm,
    color: colors.black,
  },
  vipBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFD700',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  vipText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: typography.weights.bold,
  },
  brandText: {
    fontSize: typography.sizes.xs,
    color: colors.secondary[600],
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  modelText: {
    fontSize: typography.sizes.xs,
    color: colors.secondary[600],
    textAlign: 'center',
    marginTop: 2,
  },
  colorText: {
    fontSize: typography.sizes.xs,
    color: colors.secondary[600],
    textAlign: 'center',
    marginTop: 2,
  },
});
