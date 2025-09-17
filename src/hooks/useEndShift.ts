import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postEndShift } from '../services/shiftServiceNew';
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
    onError: (error: any) => {
      console.error('-- useEndShift --', error.message);
      
      // Si es error 400, probablemente el turno ya está cerrado
      if (error.response?.status === 400) {
        Alert.alert('Turno ya cerrado', 'Este turno ya fue cerrado anteriormente');
        // Invalidar queries para refrescar el estado
        queryClient.invalidateQueries({
          queryKey: ['shift'],
        });
      } else {
        Alert.alert('Hubo un Error', 'No se pudo cerrar el turno, reinicie la app');
      }
    },
  });

  return { mutateAsync, isPending };
};
