import { useState, useEffect, useCallback } from 'react';
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
      const activeShift = await shiftService.getEstablishmentShift(establishmentId);
      setShift(activeShift);
      console.log('�� Active shift:', activeShift?.nombre || 'No active shift');
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
      
      setShift(newShift);
      console.log('✅ Shift started:', newShift.nombre);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar turno');
      console.error('Error starting shift:', err);
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
      
      await shiftService.endShift(establishmentId);
      setShift(null);
      console.log('✅ Shift ended');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar turno');
      console.error('Error ending shift:', err);
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
