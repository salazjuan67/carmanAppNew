import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Clock,
  MapPin,
  KeySquare,
  Crown,
  CreditCard,
  Smartphone,
  User,
  Phone,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Vehicle } from '../types/vehicle';
import { colors, spacing, borderRadius, typography } from '../config/theme';

const ICON_SIZE = 8;

interface VehicleCardProps {
  vehicle: Vehicle;
  /** Ancho de tarjeta (phone ~108, tablet ~132–150). */
  cardWidth?: number;
}

const getStateSoftBackground = (estado: string): string => {
  switch (estado) {
    case 'ESTACIONADO':
    case 'INGRESADO':
      return colors.error[50];
    case 'EN CAMINO':
    case 'SOLICITADO':
    case 'EN LA PUERTA':
      return colors.warning[50];
    case 'ENTREGADO':
    case 'FACTURADO':
      return colors.success[100];
    default:
      return colors.secondary[50];
  }
};

const getStateBorder = (estado: string): string => {
  switch (estado) {
    case 'ESTACIONADO':
    case 'INGRESADO':
      return colors.error[200];
    case 'EN CAMINO':
    case 'SOLICITADO':
    case 'EN LA PUERTA':
      return colors.warning[200];
    case 'ENTREGADO':
    case 'FACTURADO':
      return colors.success[300];
    default:
      return colors.secondary[200];
  }
};

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  cardWidth = 108,
}) => {
  const getDisplayHour = () => {
    if (vehicle.historialEstados && vehicle.historialEstados.length > 0) {
      const lastState = vehicle.historialEstados[vehicle.historialEstados.length - 1];
      if (lastState.fecha) {
        return new Date(lastState.fecha).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    }
    if (vehicle.horaIngreso && vehicle.horaIngreso.includes(':')) {
      return vehicle.horaIngreso;
    }
    return '--:--';
  };

  const displayHour = getDisplayHour();
  const bg = getStateSoftBackground(vehicle.estado);
  const borderCol = getStateBorder(vehicle.estado);

  const handlePress = () => {
    router.push({
      pathname: '/vehicle/details',
      params: { id: vehicle._id },
    });
  };

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: bg,
          borderColor: borderCol,
          width: cardWidth,
          minHeight: cardWidth >= 132 ? 148 : 128,
        },
      ]}
      onPress={handlePress}
    >
      {vehicle.vip && (
        <View style={styles.vipBadge}>
          <Crown color={colors.white} size={10} />
          <Text style={styles.vipText}>VIP</Text>
        </View>
      )}

      {vehicle.physicalCardNumber && (
        <View style={styles.cardBadge}>
          <CreditCard color={colors.white} size={9} />
        </View>
      )}

      {vehicle.noPhysicalCard && (
        <View style={styles.qrBadge}>
          <Smartphone color={colors.white} size={9} />
        </View>
      )}

      <Text style={[styles.plate, cardWidth >= 132 && styles.plateTablet]}>
        {vehicle.patente}
      </Text>

      <View style={styles.row}>
        <View style={styles.item}>
          <Clock color={colors.secondary[700]} size={ICON_SIZE} />
          <Text style={styles.itemText}>{displayHour}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.item}>
          <KeySquare color={colors.secondary[700]} size={ICON_SIZE} />
          <Text style={styles.itemText}>{vehicle.nroLlave?.toString() || '--'}</Text>
        </View>
        <View style={styles.item}>
          <MapPin color={colors.secondary[700]} size={ICON_SIZE} />
          <Text style={styles.itemText} numberOfLines={1}>
            {vehicle.sector}
          </Text>
        </View>
      </View>

      {vehicle.marca && (
        <Text style={styles.brandText} numberOfLines={1}>
          {typeof vehicle.marca === 'string' ? vehicle.marca : vehicle.marca.descripcion}
        </Text>
      )}

      {vehicle.modelo && (
        <Text style={styles.modelText} numberOfLines={1}>
          {vehicle.modelo}
        </Text>
      )}

      {vehicle.color && (
        <Text style={styles.colorText} numberOfLines={1}>
          {vehicle.color}
        </Text>
      )}

      {(vehicle.nombreConductor?.trim() || vehicle.telefono?.trim()) && (
        <View style={styles.driverBlock}>
          {vehicle.nombreConductor?.trim() ? (
            <View style={styles.driverRow}>
              <User color={colors.secondary[700]} size={ICON_SIZE} />
              <Text style={styles.driverText} numberOfLines={1}>
                {vehicle.nombreConductor.trim()}
              </Text>
            </View>
          ) : null}
          {vehicle.telefono?.trim() ? (
            <View style={styles.driverRow}>
              <Phone color={colors.secondary[700]} size={ICON_SIZE} />
              <Text style={styles.driverText} numberOfLines={1}>
                {vehicle.telefono.trim()}
              </Text>
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 2,
    margin: 3,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingBottom: spacing.xs,
    position: 'relative',
    paddingTop: spacing.xs,
    paddingHorizontal: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'visible',
  },
  plate: {
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.lg,
    letterSpacing: 0.5,
    color: colors.black,
    marginVertical: 2,
  },
  plateTablet: {
    fontSize: typography.sizes.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    maxWidth: '100%',
  },
  itemText: {
    fontSize: 10,
    color: colors.secondary[800],
  },
  vipBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFD700',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 9999,
    elevation: 9999,
  },
  vipText: {
    color: colors.white,
    fontSize: 7,
    fontWeight: typography.weights.bold,
  },
  cardBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.full,
    padding: 3,
    zIndex: 9999,
    elevation: 9999,
  },
  qrBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: colors.secondary[600],
    borderRadius: borderRadius.full,
    padding: 3,
    zIndex: 9999,
    elevation: 9999,
  },
  brandText: {
    fontSize: 9,
    color: colors.secondary[600],
    textAlign: 'center',
    marginTop: 2,
  },
  modelText: {
    fontSize: 9,
    color: colors.secondary[600],
    textAlign: 'center',
    marginTop: 1,
  },
  colorText: {
    fontSize: 9,
    color: colors.secondary[600],
    textAlign: 'center',
    marginTop: 1,
  },
  driverBlock: {
    width: '100%',
    marginTop: 2,
    gap: 1,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    maxWidth: '100%',
    paddingHorizontal: 1,
  },
  driverText: {
    flexShrink: 1,
    fontSize: 8,
    color: colors.secondary[800],
    textAlign: 'center',
  },
});
