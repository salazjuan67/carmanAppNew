import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vehicleService } from '../services/vehicleService';
import { ChangeEstadoResponse, UpdateVehicleState } from '../types/vehicle';
import { useLocalNotifications } from './useLocalNotifications';
import { stateChangeNotificationService, StateChangeNotification } from '../services/stateChangeNotificationService';
import { mergeIngresoInQueryCache } from '../utils/vehicleEstado';

export const useUpdateState = () => {
  const queryClient = useQueryClient();
  const { addVehicleRequestedNotification } = useLocalNotifications();

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

      if (variables.estado === 'SOLICITADO') {
        console.log('📱 Sending vehicle requested notification');

        const ingreso = response?.ingreso;
        const vehicleData = {
          _id: variables.ingresoId || ingreso?._id || '',
          patente: variables.patente || ingreso?.patente || '',
          establecimiento: {
            _id: variables.establecimiento || ingreso?.establecimiento?._id || '',
            nombre: ingreso?.establecimiento?.nombre || 'Establecimiento',
          },
        };
        addVehicleRequestedNotification(vehicleData);

        const notification: StateChangeNotification = {
          vehicleId: variables.ingresoId || '',
          patente: variables.patente || '',
          establishmentId: variables.establecimiento || '',
          previousState: variables.estadoAnterior || 'UNKNOWN',
          newState: variables.estado,
          timestamp: new Date().toISOString(),
        };

        stateChangeNotificationService.notifyStateChange(notification);
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
