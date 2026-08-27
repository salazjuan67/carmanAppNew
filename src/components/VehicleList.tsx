import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useHomeUiStore } from '../store/homeUiStore';
import { FlatList, Text, View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { VehicleCard } from './VehicleCard';
import { VehicleGroupTags } from './VehicleGroupTags';
import { Vehicle } from '../types/vehicle';
import { Shift } from '../types/shift';
import { colors, spacing, typography, borderRadius } from '../config/theme';
import { useLanguage } from '../contexts/LanguageContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import {
  getEntregaSortValue,
  getIngresoSortValue,
  getSolicitadoSortValue,
  sortVehiclesBy,
} from '../utils/vehicleSorting';
import { normalizeVehicleTurnoId } from '../utils/vehicleTurno';
import { isEgresosEstado, isIngresosEstado, isSolicitadosEstado } from '../utils/vehicleEstado';

interface VehicleListProps {
  vehicles: Vehicle[];
  loading?: boolean;
  onRefresh?: () => void | Promise<unknown>;
  activeShift?: Shift | null;
  /** Mensaje cuando el listado falló y no hay vehículos (p. ej. error de red o API). */
  listFetchError?: string;
}

export const VehicleList: React.FC<VehicleListProps> = ({ 
  vehicles, 
  loading = false, 
  onRefresh,
  activeShift,
  listFetchError,
}) => {
  const { t } = useLanguage();
  const { vehicleColumns, vehicleCardWidth, isTablet } = useResponsiveLayout();
  const [searchPlate, setSearchPlate] = useState('');
  /** Ingresos por defecto: operación diaria; notificación puede llevar a Solicitados vía useFocusEffect */
  const [selectedLayer, setSelectedLayer] = useState<'red' | 'yellow' | 'green'>('red');
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const pullRefreshRef = useRef(false);
  const activeShiftId = activeShift?._id;
  const [showSlowLoadHint, setShowSlowLoadHint] = useState(false);

  useEffect(() => {
    if (!loading || vehicles.length > 0) {
      setShowSlowLoadHint(false);
      return;
    }
    const id = setTimeout(() => setShowSlowLoadHint(true), 8000);
    return () => clearTimeout(id);
  }, [loading, vehicles.length]);

  // Filter vehicles by shift (ENTREGADO solo si coincide el turno; turno puede venir string o ref)
  const filteredByShift = useMemo(
    () =>
      vehicles.filter((item) => {
        if (!isEgresosEstado(item.estado)) return true;
        const turnoId = normalizeVehicleTurnoId(item.turno);
        return turnoId != null && activeShiftId != null && turnoId === activeShiftId;
      }),
    [vehicles, activeShiftId]
  );

  // Filter by search plate
  const searchFilteredVehicles = useMemo(
    () =>
      filteredByShift.filter((item) =>
        item.patente.toLowerCase().includes(searchPlate.toLowerCase())
      ),
    [filteredByShift, searchPlate]
  );

  const { redVehicles, yellowVehicles, greenVehicles } = useMemo(() => {
    const red = sortVehiclesBy(
      searchFilteredVehicles.filter((item) => isIngresosEstado(item.estado)),
      getIngresoSortValue
    );

    const yellow = sortVehiclesBy(
      searchFilteredVehicles.filter((item) => isSolicitadosEstado(item.estado)),
      getSolicitadoSortValue
    );

    const green = sortVehiclesBy(
      searchFilteredVehicles.filter((item) => isEgresosEstado(item.estado)),
      getEntregaSortValue
    );

    return {
      redVehicles: red,
      yellowVehicles: yellow,
      greenVehicles: green,
    };
  }, [searchFilteredVehicles]);

  const filteredVehicles = useMemo(() => {
    if (selectedLayer === 'red') return redVehicles;
    if (selectedLayer === 'yellow') return yellowVehicles;
    if (selectedLayer === 'green') return greenVehicles;
    return yellowVehicles;
  }, [selectedLayer, redVehicles, yellowVehicles, greenVehicles]);

  useFocusEffect(
    useCallback(() => {
      if (useHomeUiStore.getState().consumeSolicitadosTabRequest()) {
        setSelectedLayer('yellow');
      }
    }, [])
  );

  const handleLayerChange = (layer: 'red' | 'yellow' | 'green') => {
    setSelectedLayer(layer);
  };

  const handlePullRefresh = useCallback(async () => {
    if (!onRefresh || pullRefreshRef.current) return;
    pullRefreshRef.current = true;
    setPullRefreshing(true);
    try {
      await Promise.resolve(onRefresh());
    } finally {
      setPullRefreshing(false);
      pullRefreshRef.current = false;
    }
  }, [onRefresh]);

  const renderVehicle = ({ item }: { item: Vehicle }) => (
    <VehicleCard vehicle={item} cardWidth={vehicleCardWidth} />
  );

  if (loading && vehicles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('loadingVehicles')}</Text>
        {showSlowLoadHint ? (
          <Text style={styles.loadingSlowHint}>{t('loadingVehiclesSlowHint')}</Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Búsqueda — primera fila del área blanca, encima de los tabs */}
      <View style={styles.searchContainer}>
        <Search size={20} color={colors.secondary[500]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchByPlate')}
          placeholderTextColor={colors.secondary[400]}
          value={searchPlate}
          onChangeText={setSearchPlate}
        />
      </View>

      <View style={styles.tagsContainer}>
        <VehicleGroupTags
          vehicles={searchFilteredVehicles}
          selectedLayer={selectedLayer}
          onLayerChange={(layer) => handleLayerChange(layer)}
        />
      </View>

      {/* Vehicle List */}
      <FlatList
        key={`vehicles-${vehicleColumns}`}
        data={filteredVehicles}
        renderItem={renderVehicle}
        keyExtractor={(item) => item._id}
        numColumns={vehicleColumns}
        contentContainerStyle={styles.vehicleGrid}
        columnWrapperStyle={[styles.row, isTablet && styles.rowTablet]}
        showsVerticalScrollIndicator={false}
        onRefresh={handlePullRefresh}
        refreshing={pullRefreshing}
      />

      {/* No vehicles message */}
      {filteredVehicles.length === 0 && !loading && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchPlate
              ? `${t('noVehiclesFound')} "${searchPlate}"`
              : listFetchError?.trim()
                ? listFetchError
                : t('noVehiclesToShow')}
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
  loadingSlowHint: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.sm,
    color: colors.secondary[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.greyBackground,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  searchIcon: {
    marginLeft: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.black,
    paddingVertical: 4,
  },
  tagsContainer: {
    minHeight: 78,
    marginBottom: spacing.sm,
  },
  vehicleGrid: {
    paddingBottom: spacing.sm,
  },
  row: {
    justifyContent: 'space-around',
    paddingHorizontal: spacing.sm,
  },
  rowTablet: {
    justifyContent: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
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
