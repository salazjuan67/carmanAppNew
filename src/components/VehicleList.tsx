import React, { useState, useEffect } from 'react';
import { FlatList, Text, View, Pressable, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { VehicleCard } from './VehicleCard';
import { VehicleGroupTags } from './VehicleGroupTags';
import { Vehicle } from '../types/vehicle';
import { colors, spacing, typography, borderRadius } from '../config/theme';

interface VehicleListProps {
  vehicles: Vehicle[];
  loading?: boolean;
  onRefresh?: () => void;
}

export const VehicleList: React.FC<VehicleListProps> = ({ 
  vehicles, 
  loading = false, 
  onRefresh 
}) => {
  const [showInput, setShowInput] = useState(false);
  const [searchPlate, setSearchPlate] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<'red' | 'yellow' | 'green'>('yellow');
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);

  // Filter vehicles by shift (similar to web version)
  const filteredByShift = vehicles.filter(
    (item) => item.estado !== 'ENTREGADO' || item.estado === 'ENTREGADO'
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
    } else {
      setFilteredVehicles(greenVehicles);
    }
  }, [searchPlate, vehicles]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando vehículos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.filterBar}>
        <Pressable
          style={styles.searchButton}
          onPress={() => setShowInput(!showInput)}
        >
          <Search size={20} color={colors.black} />
        </Pressable>
        
        {showInput && (
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por patente..."
              value={searchPlate}
              onChangeText={setSearchPlate}
              autoCapitalize="characters"
            />
          </View>
        )}
        
        {!showInput && (
          <VehicleGroupTags
            vehicles={searchFilteredVehicles}
            selectedLayer={selectedLayer}
            onLayerChange={handleLayerChange}
          />
        )}
      </View>

      {/* Vehicle Grid */}
      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.gridContainer}
        numColumns={3}
        refreshing={loading}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchPlate ? 'No se encontraron vehículos' : 'No hay vehículos'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <VehicleCard vehicle={item} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    marginBottom: spacing.sm,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.secondary[300],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
    backgroundColor: colors.white,
  },
  gridContainer: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    marginTop: spacing['2xl'],
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.black,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingText: {
    fontSize: typography.sizes.base,
    color: colors.secondary[600],
    textAlign: 'center',
  },
});
