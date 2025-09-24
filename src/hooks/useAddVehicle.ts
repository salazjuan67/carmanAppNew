import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { vehicleService } from '../services/vehicleService';
import { VehicleDataWithTime } from '../types/vehicle';

export const useAddVehicle = () => {
  const queryClient = useQueryClient();

  const { data, mutate, mutateAsync, isPending } = useMutation({
    mutationFn: async (input: VehicleDataWithTime) => {
      console.log('🚗 Starting vehicle addition process...');
      console.log('🚗 Input data:', input);
      
      // Crear el ingreso directamente - la API se encarga de crear el vehículo si no existe
      console.log('🚗 Creating vehicle entry...');
      return vehicleService.postEntry(input);
    },
    onSuccess: (data) => {
      console.log('Vehicle entry created successfully!');
      queryClient.invalidateQueries({
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
