import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { vehicleService } from '../services/vehicleService';
import { VehicleDataWithTime } from '../types/vehicle';

export const useAddVehicle = (establishmentId: string) => {
  const queryClient = useQueryClient();

  const { data, mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (input: VehicleDataWithTime) => {
      console.log('🚗 Starting vehicle addition process...');
      console.log('🚗 Input data:', input);
      console.log('🚗 Establishment (postEntry):', establishmentId);

      console.log('🚗 Creating vehicle entry...');
      return vehicleService.postEntry(input, establishmentId);
    },
    onSuccess: () => {
      console.log('Vehicle entry created successfully!');
      // Refrescar listado del home (antes solo se invalidaba una key incorrecta y no aparecían los ingresos)
      void queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      void queryClient.invalidateQueries({
        queryKey: ['vehicles', establishmentId],
      });
      void queryClient.refetchQueries({ queryKey: ['vehicles', establishmentId] });
      void queryClient.invalidateQueries({
        queryKey: ['vehicles', 'unread', 'notifications'],
      });
    },
    onError: (error) => {
      console.error('-- useAddVehicle --', error.message);
      Alert.alert('Hubo un error', 'Intente con otro establecimiento.');
    },
  });

  return { mutate, mutateAsync, isPending, data };
};
