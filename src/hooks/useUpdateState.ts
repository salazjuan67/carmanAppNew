import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '../services/vehicleService';
import { ChangeEstadoResponse, UpdateVehicleState } from '../types/vehicle';
import { mergeIngresoInQueryCache } from '../utils/vehicleEstado';

export const useUpdateState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateVehicleState): Promise<ChangeEstadoResponse> => {
      console.log('🔄 Updating vehicle state with data:', data);
      return vehicleService.postEntryState(data);
    },
    onSuccess: (response, variables) => {
      console.log('🔄 Vehicle state updated successfully', response?.message);

      if (response?.ingreso?._id) {
        mergeIngresoInQueryCache(queryClient, response.ingreso);
      }

      queryClient.invalidateQueries({ queryKey: ['vehicle'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.refetchQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      console.error('Error updating vehicle state:', error);
    },
  });
};
