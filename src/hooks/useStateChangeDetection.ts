import { useRef, useEffect } from 'react';
import { Vehicle } from '../types/vehicle';
import { useLocalNotifications } from './useLocalNotifications';
import { stateChangeNotificationService, StateChangeNotification } from '../services/stateChangeNotificationService';
import { soundService } from '../services/soundService';

export const useStateChangeDetection = (
  vehicles: Vehicle[],
  establishmentId?: string
) => {
  const { addVehicleRequestedNotification } = useLocalNotifications(establishmentId);
  const previousVehiclesRef = useRef<Vehicle[]>([]);

  useEffect(() => {
    // Skip if no vehicles or first load
    if (vehicles.length === 0 || previousVehiclesRef.current.length === 0) {
      previousVehiclesRef.current = vehicles;
      return;
    }

    const isAttentionState = (estado: string) => estado === 'SOLICITADO';

    const vehiclesThatBecameRequested = vehicles.filter((currentVehicle) => {
      if (!isAttentionState(currentVehicle.estado)) return false;

      const previousVehicle = previousVehiclesRef.current.find(
        (prev) => prev._id === currentVehicle._id
      );

      return !previousVehicle || !isAttentionState(previousVehicle.estado);
    });

    vehiclesThatBecameRequested.forEach(async (vehicle) => {
      console.log('🔔 Vehicle became attention state from external source:', vehicle.patente);
      
      // Play notification sound
      await soundService.playNotificationSound();
      
      // Add local notification
      addVehicleRequestedNotification(vehicle);
      
      // Notify backend to send OneSignal push notification
      const previousVehicle = previousVehiclesRef.current.find(
        prev => prev._id === vehicle._id
      );
      
      const notification: StateChangeNotification = {
        vehicleId: vehicle._id,
        patente: vehicle.patente,
        establishmentId: vehicle.establecimiento?._id || '',
        previousState: previousVehicle?.estado || 'UNKNOWN',
        newState: vehicle.estado,
        timestamp: new Date().toISOString(),
      };
      
      await stateChangeNotificationService.notifyStateChange(notification);
    });

    // Update the previous vehicles reference
    previousVehiclesRef.current = vehicles;
  }, [vehicles, addVehicleRequestedNotification]);

  return null; // This hook doesn't return anything, it just handles side effects
};
