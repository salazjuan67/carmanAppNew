import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { VehicleTag } from './VehicleTag';
import { Vehicle } from '../types/vehicle';
import { colors, spacing } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getEntregaSortValue,
  getIngresoSortValue,
  getSolicitadoSortValue,
  sortVehiclesBy,
} from '../utils/vehicleSorting';
import { isEgresosEstado, isIngresosEstado, isSolicitadosEstado } from '../utils/vehicleEstado';

interface VehicleGroupTagsProps {
  vehicles: Vehicle[];
  selectedLayer: 'red' | 'yellow' | 'green';
  onLayerChange: (layer: 'red' | 'yellow' | 'green', vehicles: Vehicle[]) => void;
}

export const VehicleGroupTags: React.FC<VehicleGroupTagsProps> = ({ 
  vehicles, 
  selectedLayer, 
  onLayerChange 
}) => {
  const { t } = useLanguage();

  const redVehicles = useMemo(
    () =>
      sortVehiclesBy(
        vehicles.filter((item) => isIngresosEstado(item.estado)),
        getIngresoSortValue
      ),
    [vehicles]
  );

  const yellowVehicles = useMemo(
    () =>
      sortVehiclesBy(
        vehicles.filter((item) => isSolicitadosEstado(item.estado)),
        getSolicitadoSortValue
      ),
    [vehicles]
  );

  const greenVehicles = useMemo(
    () =>
      sortVehiclesBy(
        vehicles.filter((item) => isEgresosEstado(item.estado)),
        getEntregaSortValue
      ),
    [vehicles]
  );

  const handlePress = (group: 'red' | 'yellow' | 'green') => () => {
    const mapVehicles = {
      red: redVehicles,
      yellow: yellowVehicles,
      green: greenVehicles,
    };
    
    onLayerChange(group, mapVehicles[group]);
  };

  return (
    <View style={styles.container}>
      <VehicleTag
        layer="red"
        selected={selectedLayer === 'red'}
        state="INGRESADO"
        displayText={t('ingresos')}
        quantity={redVehicles.length}
        onPress={handlePress('red')}
      />
      <VehicleTag
        layer="yellow"
        selected={selectedLayer === 'yellow'}
        state="SOLICITADO"
        displayText={t('solicitados')}
        quantity={yellowVehicles.length}
        onPress={handlePress('yellow')}
      />
      <VehicleTag
        layer="green"
        selected={selectedLayer === 'green'}
        state="ENTREGADO"
        displayText={t('egresos')}
        quantity={greenVehicles.length}
        onPress={handlePress('green')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
});
