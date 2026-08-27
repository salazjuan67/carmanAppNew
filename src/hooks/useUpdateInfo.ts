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
    onSuccess: (_data, variables) => {
      console.log('🔄 useUpdateInfo - Success:', { variables });
      // Lista en home (prefijo ['vehicles', establishmentId] u otras variantes)
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      // Detalle del ingreso concreto
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.idVehicle] });
      // Cualquier otra query que use solo el prefijo 'vehicle'
      queryClient.invalidateQueries({ queryKey: ['vehicle'] });
    },
    onError: (error, variables) => {
      console.error('❌ useUpdateInfo - Error:', { error, variables });
    },
  });
};
