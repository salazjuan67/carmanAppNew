import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { VehicleTag } from './VehicleTag';
import { Vehicle } from '../types/vehicle';
import { colors, spacing } from '../config/theme';

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
  const sortVehicles = (el1: Vehicle, el2: Vehicle) => {
    const fecha1 = el1.createdAt || el1.horaIngreso;
    const fecha2 = el2.createdAt || el2.horaIngreso;
    return new Date(fecha1).getTime() - new Date(fecha2).getTime();
  };

  const redVehicles = vehicles
    .filter((item) => item.estado === 'INGRESADO' || item.estado === 'ESTACIONADO')
    .sort(sortVehicles);

  const yellowVehicles = vehicles
    .filter((item) => item.estado === 'SOLICITADO' || item.estado === 'EN CAMINO')
    .sort(sortVehicles);

  const greenVehicles = vehicles
    .filter((item) => item.estado === 'ENTREGADO' || item.estado === 'FACTURADO')
    .sort(sortVehicles);

  // Set default layer to yellow on mount
  useEffect(() => {
    if (yellowVehicles.length > 0) {
      onLayerChange('yellow', yellowVehicles);
    }
  }, []);

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
        selected={selectedLayer === 'red'}
        state="INGRESADO"
        displayText="Ingresos"
        quantity={redVehicles.length}
        onPress={handlePress('red')}
      />
      <VehicleTag
        selected={selectedLayer === 'yellow'}
        state="SOLICITADO"
        displayText="Solicitados"
        quantity={yellowVehicles.length}
        onPress={handlePress('yellow')}
      />
      <VehicleTag
        selected={selectedLayer === 'green'}
        state="ENTREGADO"
        displayText="Egresos"
        quantity={greenVehicles.length}
        onPress={handlePress('green')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
});
