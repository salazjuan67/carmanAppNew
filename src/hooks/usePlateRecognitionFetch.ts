import { useState } from 'react'
import { Alert } from 'react-native'
import { plateRecognizerService, VehicleRecognitionResult } from '../services/plateRecognizerService'

export const usePlateRecognitionFetch = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastResult, setLastResult] = useState<VehicleRecognitionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const recognizeVehicle = async (imageUri: string): Promise<VehicleRecognitionResult | null> => {
    try {
      console.log('Setting loading states...')
      setIsProcessing(true)
      setIsLoading(true)
      setLastResult(null)

      console.log('Starting plate recognition with fetch for:', imageUri)
      
      const result = await plateRecognizerService.recognizePlate(imageUri)
      
      if (result) {
        const vehicleResult: VehicleRecognitionResult = {
          plate: result.plate,
          brand: result.brand || '',
          model: result.model || '',
          color: result.color || '',
          confidence: result.confidence
        }
        
        setLastResult(vehicleResult)
        
        // No mostrar Alert, solo retornar el resultado
        // El loader se ocultará automáticamente
        return vehicleResult
      } else {
        // No mostrar Alert, solo retornar null
        return null
      }
    } catch (error) {
      console.error('Error in plate recognition with fetch:', error)
      // No mostrar Alert, solo retornar null
      return null
    } finally {
      console.log('Clearing loading states...')
      setIsProcessing(false)
      setIsLoading(false)
    }
  }

  const testConnection = async (): Promise<boolean> => {
    try {
      setIsProcessing(true)
      console.log('Testing connection with fetch service...')
      const isConnected = await plateRecognizerService.testConnection()
      
      if (isConnected) {
        Alert.alert('Conexión Exitosa', 'La API de Plate Recognizer está funcionando correctamente. Solo reconoce patentes (sin marca/modelo/color).')
      } else {
        Alert.alert('Error de Conexión', 'No se pudo conectar con la API de Plate Recognizer')
      }
      
      return isConnected
    } catch (error) {
      console.error('Connection test error with fetch:', error)
      Alert.alert('Error', 'Error al probar la conexión con la API usando fetch')
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  const clearLastResult = () => {
    setLastResult(null)
  }

  return {
    recognizeVehicle,
    testConnection,
    isProcessing,
    isLoading,
    lastResult,
    clearLastResult
  }
}

