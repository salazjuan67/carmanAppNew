import React, { useState, useEffect } from 'react';
import { FlatList, Text, View, Pressable, TextInput, StyleSheet } from 'react-native';
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
  const [showInput, setShowInput] = useState(false);
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
      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <Pressable
          style={styles.searchButton}
          onPress={() => setShowInput(!showInput)}
        >
          <Search size={20} color={colors.secondary[600]} />
          <Text style={styles.searchButtonText}>
            {searchPlate ? `"${searchPlate}"` : 'Buscar vehículo...'}
          </Text>
        </Pressable>

        {showInput && (
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por patente..."
            value={searchPlate}
            onChangeText={setSearchPlate}
            autoFocus
          />
        )}
      </View>

      {/* Vehicle Tags */}
      <VehicleGroupTags
        vehicles={searchFilteredVehicles}
        selectedLayer={selectedLayer}
        onLayerChange={handleLayerChange}
      />

      {/* Vehicle List */}
      <FlatList
        data={filteredVehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item._id}
        numColumns={3}
        contentContainerStyle={styles.vehicleGrid}
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
  searchSection: {
    marginBottom: spacing.md,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  searchButtonText: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.secondary[600],
  },
  searchInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.secondary[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    fontSize: typography.sizes.base,
    color: colors.black,
  },
  vehicleGrid: {
    paddingBottom: spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.secondary[600],
    textAlign: 'center',
  },
});
