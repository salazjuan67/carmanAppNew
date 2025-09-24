import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { vehicleService } from '../services/vehicleService';
import { Vehicle } from '../types/vehicle';

export const useVehiclesWithPolling = (establishmentId?: string) => {
  const queryClient = useQueryClient();

  // Query con polling automático cada 3 segundos
  const {
    data: vehicles = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['vehicles', establishmentId],
    queryFn: () => vehicleService.getEntries(establishmentId!),
    enabled: !!establishmentId,
    refetchInterval: 3000, // Refetch cada 3 segundos
    refetchIntervalInBackground: true, // Continuar polling en background
    staleTime: 1000, // Considerar datos stale después de 1 segundo
    gcTime: 0, // No cachear datos para siempre tener datos frescos
  });

  // Refetch cuando la pantalla recibe focus
  useFocusEffect(
    useCallback(() => {
      if (establishmentId) {
        console.log('🔄 Screen focused - refetching vehicles');
        refetch();
      }
    }, [establishmentId, refetch])
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

  return {
    vehicles,
    loading: isLoading,
    error,
    refetch: refetchImmediate,
    invalidateAndRefetch,
  };
};
