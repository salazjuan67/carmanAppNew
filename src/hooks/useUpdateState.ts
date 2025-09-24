import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '../services/vehicleService';
import { UpdateVehicleState } from '../types/vehicle';

export const useUpdateState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateVehicleState) => vehicleService.postEntryState(data),
    onSuccess: (_, variables) => {
      console.log('🔄 Vehicle state updated - invalidating queries');
      // Invalidate and refetch vehicle data immediately
      queryClient.invalidateQueries({ queryKey: ['vehicle'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      
      // Force immediate refetch for real-time updates
      queryClient.refetchQueries({ queryKey: ['vehicles'] });
    },
    onError: (error) => {
      console.error('Error updating vehicle state:', error);
    },
  });
};
