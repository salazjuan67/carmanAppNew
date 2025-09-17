import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { shiftService } from '../services/shiftService';
import { Shift, NewShiftBody, ShiftState } from '../types/shift';

export const useShift = (establishmentId?: string) => {
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShift = useCallback(async () => {
    if (!establishmentId) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching shift for establishment:', establishmentId);
      console.log('🔄 Current shift state before fetch:', shift?.nombre || 'No shift');
      
      const activeShift = await shiftService.getEstablishmentShift(establishmentId);
      setShift(activeShift);
      
      console.log('✅ Active shift found:', activeShift?.nombre || 'No active shift');
      console.log('✅ Shift ID:', activeShift?._id || 'No ID');
      console.log('✅ Shift establishment:', activeShift?.establecimiento || 'No establishment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar turno');
      console.error('Error fetching shift:', err);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  const startShift = useCallback(async (turno: ShiftState): Promise<boolean> => {
    if (!establishmentId) return false;
    
    try {
      setLoading(true);
      setError(null);
      
      const shiftName = `${new Date().toLocaleDateString('es-ES')} - ${establishmentId} - ${turno}`;
      
      const newShift = await shiftService.createShift({
        establecimiento: establishmentId,
        turno,
        nombre: shiftName,
      });
      
          if (newShift && newShift._id) {
            setShift(newShift as Shift);
            console.log('✅ Shift started:', newShift.nombre || 'Sin nombre');
            return true;
          } else {
            throw new Error('Respuesta inválida del servidor');
          }
    } catch (err) {
      let errorMessage = 'Error al iniciar turno';
      
      if (err instanceof Error) {
        if (err.message.includes('servicio de turnos no está disponible')) {
          errorMessage = 'El servicio de turnos no está disponible. Contacte al administrador del sistema.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Error starting shift:', err);
      Alert.alert('Error del Servidor', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  const endShift = useCallback(async (): Promise<boolean> => {
    if (!establishmentId) return false;
    
    try {
      setLoading(true);
      setError(null);
      
          const endedShift = await shiftService.endShift(establishmentId);
          setShift(null);
          console.log('✅ Shift ended');
          return true;
    } catch (err) {
      let errorMessage = 'Error al cerrar turno';
      
      if (err instanceof Error) {
        if (err.message.includes('servicio de turnos no está disponible')) {
          errorMessage = 'El servicio de turnos no está disponible. Contacte al administrador del sistema.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      console.error('Error ending shift:', err);
      Alert.alert('Error del Servidor', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    fetchShift();
  }, [fetchShift]);

  return {
    shift,
    loading,
    error,
    startShift,
    endShift,
    refetch: fetchShift,
  };
};
