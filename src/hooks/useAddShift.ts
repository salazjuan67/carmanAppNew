import { NewShiftBody } from '../types/shift';
import { postShift } from '../services/shiftServiceNew';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';

export const useAddShift = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (input: NewShiftBody) => postShift(input),
    onSuccess: (data) => {
      Alert.alert('Turno abierto', data.nombre);
      // Invalidar todas las queries de turnos para refrescar el estado
      queryClient.invalidateQueries({
        queryKey: ['shift'],
      });
    },
    onError: (error) => {
      console.error('-- useAddShift --', error.message);
      Alert.alert('Hubo un Error', 'No se pudo abrir el turno, reinicie la app');
    },
  });

  return { mutateAsync, isPending };
};
