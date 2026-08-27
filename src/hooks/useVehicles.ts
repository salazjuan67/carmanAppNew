import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { vehicleService } from '../services/vehicleService';
import { STORAGE_KEYS } from '../config/constants';
import { apiClient } from '../services/apiClient';
import { oneSignalService } from '../services/oneSignalService';
import { useStateChangeDetection } from './useStateChangeDetection';
import { Vehicle, Brand, VehicleFound, VehicleFormData, UpdateVehicleState, Establishment } from '../types/vehicle';

const SELECTED_ESTABLISHMENT_KEY = 'selected_establishment';

// Lista de emails que pueden ver todos los establecimientos
const ADMIN_EMAILS = [
  'santiagocapo91@gmail.com',
  'salazjuan67@gmail.com',
  'mmoretticom@gmail.com',
];

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
      console.log('🚗 Fetching vehicles for establishment:', establishmentId);
      const result = await vehicleService.getEntries(establishmentId);
      setVehicles(result);
      console.log('🚗 Fetched vehicles:', result.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar vehículos');
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  const fetchBrands = useCallback(async () => {
    try {
      const result = await vehicleService.getBrands();
      setBrands(result);
    } catch (err) {
      console.error('Error fetching brands:', err);
    }
  }, []);

  const addVehicle = useCallback(async (vehicleData: VehicleFormData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const horaIngreso = new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      await vehicleService.postEntry(
        { ...vehicleData, horaIngreso },
        vehicleData.establecimiento
      );
      await fetchVehicles();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar vehículo');
      console.error('Error adding vehicle:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchVehicles]);

  const updateVehicleState = useCallback(async (updateData: UpdateVehicleState): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await vehicleService.postEntryState(updateData);
      await fetchVehicles();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado');
      console.error('Error updating vehicle state:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchVehicles]);

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

  // Detect state changes and add notifications
  useStateChangeDetection(vehicles, establishmentId);

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
  const selectedEstablishmentRef = useRef<Establishment | null>(null);
  selectedEstablishmentRef.current = selectedEstablishment;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  // Function to save selected establishment to storage
  const saveSelectedEstablishment = useCallback(async (establishment: Establishment | null) => {
    try {
      if (establishment) {
        await AsyncStorage.setItem(SELECTED_ESTABLISHMENT_KEY, JSON.stringify(establishment));
        console.log('💾 Saved selected establishment:', establishment.nombre);
      } else {
        await AsyncStorage.removeItem(SELECTED_ESTABLISHMENT_KEY);
        console.log('💾 Cleared selected establishment');
      }
    } catch (error) {
      console.error('❌ Error saving selected establishment:', error);
    }
  }, []);

  // Function to load selected establishment from storage
  const loadSelectedEstablishment = useCallback(async (): Promise<Establishment | null> => {
    try {
      const saved = await AsyncStorage.getItem(SELECTED_ESTABLISHMENT_KEY);
      if (saved) {
        const establishment = JSON.parse(saved);
        console.log('💾 Loaded selected establishment:', establishment.nombre);
        return establishment;
      }
      return null;
    } catch (error) {
      console.error('❌ Error loading selected establishment:', error);
      return null;
    }
  }, []);

  // Function to update OneSignal tags when establishment changes
  const updateOneSignalTags = useCallback(async (establishment: Establishment | null) => {
    try {
      if (establishment) {
        console.log('🔔 Updating OneSignal tags for establishment:', establishment.nombre);
        await oneSignalService.setUserTags({
          establishment_id: establishment._id,
          establishment_name: establishment.nombre,
        });
        console.log('✅ OneSignal tags updated:', {
          establishment_id: establishment._id,
          establishment_name: establishment.nombre,
        });
      } else {
        console.log('🔔 Clearing OneSignal establishment tags');
        await oneSignalService.setUserTags({});
        console.log('✅ OneSignal establishment tags cleared');
      }
    } catch (error) {
      console.error('❌ Error updating OneSignal tags:', error);
    }
  }, []);

  const fetchEstablishments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏢 Fetching establishments...');
      const response = await apiClient.getEstablishments();
      
      if (response.success && response.data) {
        console.log('🏢 Fetched establishments:', response.data.map(e => e.nombre));

        // Leer usuario para conocer a qué establecimientos está habilitado
        const savedUserRaw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        let filtered = response.data as Establishment[];

        if (savedUserRaw) {
          try {
            const savedUser = JSON.parse(savedUserRaw);
            
            // Verificar si el usuario puede ver todos los establecimientos
            // Opciones: rol === 'admin', canViewAllEstablishments === true, email en lista permitida del backend, o email en lista local
            const userEmail = savedUser?.email?.toLowerCase().trim();
            const rolNorm = String(
              savedUser?.rol ?? savedUser?.role ?? savedUser?.tipoUsuario ?? ''
            )
              .toLowerCase()
              .trim();
            const isAdminRol =
              rolNorm === 'admin' ||
              rolNorm === 'administrador' ||
              rolNorm === 'superadmin' ||
              rolNorm === 'super_admin' ||
              rolNorm === 'super administrador';
            const canViewAll =
              isAdminRol ||
              savedUser?.canViewAllEstablishments === true ||
              savedUser?.verTodosLosEstablecimientos === true ||
              (Array.isArray(savedUser?.allowedEmails) &&
                savedUser.allowedEmails.includes(savedUser?.email)) ||
              (userEmail && ADMIN_EMAILS.includes(userEmail));
            
            if (canViewAll) {
              // Admin o usuario con permisos especiales: ver todos los establecimientos activos
              console.log('🔓 User has admin access, showing all active establishments');
              filtered = filtered.filter((e: any) => (e.active === undefined || e.active === true || e.activo === true));
            } else {
              // Usuario normal: filtrar por establecimientos asignados
              // Soportar formatos: string[], {_id: string}[], o campo singular 'establecimiento'
              let userEstIds: string[] = [];
              if (Array.isArray(savedUser?.establecimientos)) {
                userEstIds = savedUser.establecimientos.map((item: any) =>
                  typeof item === 'string' ? item : item?._id
                ).filter(Boolean);
              } else if (typeof savedUser?.establecimiento === 'string') {
                userEstIds = [savedUser.establecimiento];
              } else if (savedUser?.establecimiento?._id) {
                userEstIds = [savedUser.establecimiento._id];
              }

              if (userEstIds.length > 0) {
                // Intersección: solo establecimientos asignados al usuario y activos (si viene el flag)
                filtered = filtered.filter((e: any) => {
                  const isAssigned = userEstIds.includes(e._id);
                  const isActive = (e.active === undefined || e.active === true || e.activo === true);
                  return isAssigned && isActive;
                });
              } else {
                // Si el usuario no tiene lista, mostrar solo activos para evitar mostrar deshabilitados
                filtered = filtered.filter((e: any) => (e.active === undefined || e.active === true || e.activo === true));
              }
            }
          } catch (e) {
            console.warn('⚠️ Could not parse saved user for establishment filtering');
            filtered = filtered.filter((e: any) => (e.active === undefined || e.active === true || e.activo === true));
          }
        } else {
          // Sin usuario guardado: solo activos
          filtered = filtered.filter((e: any) => (e.active === undefined || e.active === true || e.activo === true));
        }

        console.log('🏢 Establishments after filtering:', filtered.map(e => e.nombre));
        setEstablishments(filtered);

        // Load saved establishment or auto-select
        if (!hasInitiallyLoaded) {
          const savedEstablishment = await loadSelectedEstablishment();

          if (savedEstablishment) {
            // Chequear si el guardado todavía existe en la lista filtrada
            const foundEstablishment = filtered.find(e => e._id === savedEstablishment._id);
            if (foundEstablishment) {
              console.log('🏢 Restoring saved establishment:', foundEstablishment.nombre);
              setSelectedEstablishment(foundEstablishment);
              await updateOneSignalTags(foundEstablishment);
            } else if (filtered.length > 0) {
              console.log('🏢 Saved establishment not allowed anymore, selecting first allowed:', filtered[0].nombre);
              setSelectedEstablishment(filtered[0]);
              await updateOneSignalTags(filtered[0]);
            } else {
              console.log('🏢 No allowed establishments available for this user');
              setSelectedEstablishment(null);
              await updateOneSignalTags(null);
            }
          } else if (filtered.length > 0) {
            // Si solo hay uno, selecciónalo; si hay varios, seleccionar el primero para no dejar vacío
            console.log('🏢 No saved establishment, selecting first allowed:', filtered[0].nombre);
            setSelectedEstablishment(filtered[0]);
            await updateOneSignalTags(filtered[0]);
          } else {
            console.log('🏢 No allowed establishments to select');
            setSelectedEstablishment(null);
            await updateOneSignalTags(null);
          }
        } else {
          const current = selectedEstablishmentRef.current;
          if (current) {
            // Validar que la selección actual siga en la lista (ref = no re-disparar fetch al cambiar selector)
            const stillExists = filtered.find((e) => e._id === current._id);
            if (!stillExists) {
              if (filtered.length > 0) {
                console.log('🏢 Previously selected establishment no longer allowed, selecting first allowed:', filtered[0].nombre);
                setSelectedEstablishment(filtered[0]);
                await updateOneSignalTags(filtered[0]);
              } else {
                console.log('🏢 Previously selected establishment removed and no allowed establishments available');
                setSelectedEstablishment(null);
                await updateOneSignalTags(null);
              }
            } else {
              console.log('🏢 Keeping selected establishment:', current.nombre);
            }
          }
        }

        setHasInitiallyLoaded(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar establecimientos');
      console.error('Error fetching establishments:', err);
    } finally {
      setLoading(false);
    }
    // No incluir selectedEstablishment: evita refetch de la lista al cada cambio de selector (rompía ingresos).
  }, [hasInitiallyLoaded, loadSelectedEstablishment, updateOneSignalTags]);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  // Custom setter that updates OneSignal tags when establishment changes
  const handleSetSelectedEstablishment = useCallback(async (establishment: Establishment | null) => {
    console.log('🏢 Changing establishment to:', establishment?.nombre || 'None');
    setSelectedEstablishment(establishment);
    
    // Save to storage
    await saveSelectedEstablishment(establishment);
    
    // Update OneSignal tags when establishment changes
    await updateOneSignalTags(establishment);
  }, [updateOneSignalTags, saveSelectedEstablishment]);

  return {
    establishments,
    selectedEstablishment,
    setSelectedEstablishment: handleSetSelectedEstablishment,
    loading,
    error,
    refetch: fetchEstablishments,
  };
};
