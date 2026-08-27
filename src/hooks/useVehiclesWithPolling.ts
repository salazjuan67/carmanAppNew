import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { vehicleService } from '../services/vehicleService';
import {
  isNonRetryableVehicleHttpError,
  isSessionExpiredVehicleError,
  SESSION_EXPIRED_USER_MESSAGE,
} from '../services/sessionExpired';
import { useStateChangeDetection } from './useStateChangeDetection';
import { Vehicle } from '../types/vehicle';

export const useVehiclesWithPolling = (establishmentId?: string) => {
  const queryClient = useQueryClient();
  const noop = useCallback(() => {}, []);

  // Polling cada 8s — suficiente para operaciones de valet; sin refetch en background (batería)
  const {
    data: vehicles = [],
    /** Con `enabled: false` (sin establishmentId) `isPending` sigue true en RQ v5; `isLoading` solo si hay fetch activo */
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vehicles', establishmentId],
    // Siempre tomar el id desde queryKey (evita closure obsoleto al cambiar establecimiento).
    queryFn: ({ queryKey }) => {
      const id = queryKey[1] as string | undefined;
      if (!id) throw new Error('establishmentId requerido');
      return vehicleService.getEntries(id);
    },
    enabled: !!establishmentId,
    refetchInterval: (query) =>
      isNonRetryableVehicleHttpError(query.state.error) ? false : 8000,
    refetchIntervalInBackground: false,
    retry: (failureCount, err) => {
      if (isNonRetryableVehicleHttpError(err)) return false;
      return failureCount < 1;
    },
    retryDelay: 3000,
    // Mantener datos previos visibles durante el polling (no volver a pantalla de carga)
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
  });

  const sessionExpired = isSessionExpiredVehicleError(error);
  const displayVehicles = sessionExpired ? [] : vehicles;

  // Refetch cuando la pantalla recibe focus
  useFocusEffect(
    useCallback(() => {
      if (establishmentId && !sessionExpired) {
        refetch();
      }
    }, [establishmentId, refetch, sessionExpired])
  );

  // Función para invalidar y refetch manualmente
  const invalidateAndRefetch = useCallback(() => {
    console.log('🔄 Manual invalidate and refetch');
    queryClient.invalidateQueries({ queryKey: ['vehicles', establishmentId] });
  }, [queryClient, establishmentId]);

  // Función para refetch inmediato
  const refetchImmediate = useCallback(() => {
    console.log('🔄 Immediate refetch');
    refetch();
  }, [refetch]);

  // Detect state changes and add notifications
  useStateChangeDetection(displayVehicles, establishmentId);

  if (sessionExpired) {
    return {
      vehicles: [],
      loading: false,
      refreshing: false,
      error: SESSION_EXPIRED_USER_MESSAGE,
      refetch: noop,
      invalidateAndRefetch: noop,
    };
  }

  return {
    vehicles,
    /** Solo pantalla de carga en la primera fetch sin datos; el polling no activa loader */
    loading: isLoading && vehicles.length === 0,
    /** No usar el spinner del FlatList para el polling cada 8s (evita “cargando” permanente) */
    refreshing: false,
    error,
    refetch: refetchImmediate,
    invalidateAndRefetch,
  };
};
