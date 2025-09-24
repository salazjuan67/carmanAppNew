import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '../services/vehicleService';

interface UpdateVehicleFormData {
  patente: string;
  sector: string;
  establecimiento: string;
  horaIngreso: string;
  nombreConductor?: string;
  telefono?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  active?: boolean;
}

export const useUpdateInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ idVehicle, body }: { idVehicle: string; body: UpdateVehicleFormData }) => {
      console.log('🔄 useUpdateInfo - Starting mutation:', { idVehicle, body });
      return vehicleService.putEntryInfo(idVehicle, body);
    },
    onSuccess: (data, variables) => {
      console.log('🔄 useUpdateInfo - Success:', { data, variables });
      // Solo invalidar queries, no forzar refetch
      queryClient.invalidateQueries({ queryKey: ['vehicle'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
    onError: (error, variables) => {
      console.error('❌ useUpdateInfo - Error:', { error, variables });
    },
  });
};
