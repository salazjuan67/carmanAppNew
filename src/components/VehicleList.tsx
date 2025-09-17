import React, { useState, useEffect } from 'react';
import { FlatList, Text, View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { VehicleCard } from './VehicleCard';
import { VehicleGroupTags } from './VehicleGroupTags';
import { Vehicle } from '../types/vehicle';
import { Shift } from '../types/shift';
import { colors, spacing, typography, borderRadius } from '../config/theme';

interface VehicleListProps {
  vehicles: Vehicle[];
  loading?: boolean;
  onRefresh?: () => void;
  activeShift?: Shift | null;
}

export const VehicleList: React.FC<VehicleListProps> = ({ 
  vehicles, 
  loading = false, 
  onRefresh,
  activeShift 
}) => {
  const [searchPlate, setSearchPlate] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<'red' | 'yellow' | 'green'>('yellow');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);

  // Filter vehicles by shift (similar to web version)
  const filteredByShift = vehicles.filter(
    (item) => item.estado !== 'ENTREGADO' || (item.estado === 'ENTREGADO' && item.turno === activeShift?._id)
  );

  // Filter by search plate
  const searchFilteredVehicles = filteredByShift.filter((item) =>
    item.patente.toLowerCase().includes(searchPlate.toLowerCase())
  );

  // Group vehicles by state
  const redVehicles = searchFilteredVehicles.filter(
    (item) => item.estado === 'INGRESADO' || item.estado === 'ESTACIONADO'
  );
  const yellowVehicles = searchFilteredVehicles.filter(
    (item) => item.estado === 'SOLICITADO' || item.estado === 'EN CAMINO'
  );
  const greenVehicles = searchFilteredVehicles.filter(
    (item) => item.estado === 'ENTREGADO' || item.estado === 'FACTURADO'
  );

  const handleLayerChange = (layer: 'red' | 'yellow' | 'green', vehicles: Vehicle[]) => {
    setSelectedLayer(layer);
    setFilteredVehicles(vehicles);
  };

  // Set initial filtered vehicles
  useEffect(() => {
    if (yellowVehicles.length > 0) {
      setFilteredVehicles(yellowVehicles);
    } else if (redVehicles.length > 0) {
      setFilteredVehicles(redVehicles);
    } else if (greenVehicles.length > 0) {
      setFilteredVehicles(greenVehicles);
    } else {
      setFilteredVehicles([]);
    }
  }, [yellowVehicles.length, redVehicles.length, greenVehicles.length]);

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <VehicleCard vehicle={item} />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando vehículos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Search size={18} color={colors.secondary[600]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por patente..."
          placeholderTextColor={colors.secondary[400]}
          value={searchPlate}
          onChangeText={setSearchPlate}
        />
      </View>

      {/* Vehicle Tags */}
      <View style={styles.tagsContainer}>
        <VehicleGroupTags
          vehicles={searchFilteredVehicles}
          selectedLayer={selectedLayer}
          onLayerChange={handleLayerChange}
        />
      </View>

      {/* Vehicle List */}
      <FlatList
        data={filteredVehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item._id}
        numColumns={3}
        contentContainerStyle={styles.vehicleGrid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={loading}
      />

      {/* No vehicles message */}
      {filteredVehicles.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchPlate 
              ? `No se encontraron vehículos con patente "${searchPlate}"`
              : 'No hay vehículos para mostrar'
            }
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.secondary[600],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.black,
    paddingVertical: spacing.xs,
  },
  tagsContainer: {
    height: 70,
    marginBottom: spacing.sm,
  },
  vehicleGrid: {
    paddingBottom: spacing.sm,
  },
  row: {
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: colors.secondary[600],
    textAlign: 'center',
  },
});
