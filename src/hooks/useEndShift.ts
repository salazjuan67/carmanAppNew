import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postEndShift, ShiftApiError } from '../services/shiftServiceNew';
import { Alert } from 'react-native';

export const useEndShift = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (id: string) => postEndShift(id),
    onSuccess: (data) => {
      Alert.alert('Turno cerrado', data.nombre);
      // Invalidar todas las queries de turnos para refrescar el estado
      queryClient.invalidateQueries({
        queryKey: ['shift'],
      });
    },
    onError: (error: ShiftApiError) => {
      console.error('-- useEndShift --', error.message);

      if (error.status === 400) {
        Alert.alert('Turno ya cerrado', 'Este turno ya fue cerrado anteriormente');
        queryClient.invalidateQueries({
          queryKey: ['shift'],
        });
        return;
      }

      Alert.alert('Hubo un Error', error.message || 'No se pudo cerrar el turno');
    },
  });

  return { mutateAsync, isPending };
};
