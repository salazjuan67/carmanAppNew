import { useState, useEffect, useCallback } from 'react';
import { vehicleService } from '../services/vehicleService';
import { apiClient } from '../services/apiClient';
import { Vehicle, Brand, VehicleFound, VehicleFormData, UpdateVehicleState, Establishment } from '../types/vehicle';

export const useVehicles = (establishmentId?: string) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!establishmentId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getEntries(establishmentId);
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar vehículos');
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getBrands();
      setBrands(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar marcas');
      console.error('Error fetching brands:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const addVehicle = useCallback(async (vehicleData: VehicleFormData): Promise<Vehicle | null> => {
    try {
      setLoading(true);
      setError(null);
      const newVehicle = await vehicleService.postEntry(vehicleData);
      setVehicles(prev => [newVehicle, ...prev]);
      return newVehicle;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar vehículo');
      console.error('Error adding vehicle:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVehicleState = useCallback(async (updateData: UpdateVehicleState): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await vehicleService.postEntryState(updateData);
      
      // Update local state
      setVehicles(prev => prev.map(vehicle => 
        vehicle._id === updateData.ingresoId 
          ? { ...vehicle, estado: updateData.estado, horaEgreso: updateData.horaEgreso }
          : vehicle
      ));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado del vehículo');
      console.error('Error updating vehicle state:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchPlate = useCallback(async (patente: string, establishmentId: string): Promise<VehicleFound | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await vehicleService.getSearchPlate(patente, establishmentId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar patente');
      console.error('Error searching plate:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  return {
    vehicles,
    brands,
    loading,
    error,
    fetchVehicles,
    addVehicle,
    updateVehicleState,
    searchPlate,
    refetch: fetchVehicles,
  };
};

// Hook for managing establishments
export const useEstablishments = () => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState<Establishment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstablishments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏢 Fetching establishments...');
      const response = await apiClient.getEstablishments();
      
      if (response.success && response.data) {
        setEstablishments(response.data);
        
        // Auto-select first establishment if none selected
        if (!selectedEstablishment && response.data.length > 0) {
          setSelectedEstablishment(response.data[0]);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar establecimientos');
      console.error('Error fetching establishments:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedEstablishment]);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  return {
    establishments,
    selectedEstablishment,
    setSelectedEstablishment,
    loading,
    error,
    refetch: fetchEstablishments,
  };
};
