// Servicio real de Plate Recognizer basado en la app vieja
// Solo reconoce patentes (no marca/modelo/color - requiere plan premium)

const PLATE_RECOGNIZER_CONFIG = {
  BASE_URL: 'https://api.platerecognizer.com/v1',
  API_TOKEN: '865b0afbd03d45c55687cf7b77da19a1e4e3a47f',
  REGIONS: ['ar'], // Argentina
}

export interface PlateRecognitionResult {
  plate: string
  confidence: number
  brand?: string
  model?: string
  color?: string
}

export interface VehicleRecognitionResult {
  plate: string
  brand: string
  model: string
  color: string
  confidence: number
}

class PlateRecognizerService {
  
  /**
   * Reconoce patente usando fetch nativo
   */
  async recognizePlate(imageUri: string): Promise<PlateRecognitionResult | null> {
    try {
      console.log('Starting plate recognition with fetch for:', imageUri)
      
      const formData = new FormData()
      
      // Si es una URL, usar upload_url
      if (imageUri.startsWith('http')) {
        formData.append('upload_url', imageUri)
      } else {
        // Si es archivo local, usar upload
        formData.append('upload', {
          uri: imageUri,
          type: 'image/jpeg',
          name: 'plate.jpg',
        } as any)
      }
      
      // Agregar regiones
      PLATE_RECOGNIZER_CONFIG.REGIONS.forEach(region => {
        formData.append('regions', region)
      })
      
      // Habilitar MMC (Make, Model, Color) para obtener más información
      formData.append('mmc', 'true')

      console.log('Sending request to:', `${PLATE_RECOGNIZER_CONFIG.BASE_URL}/plate-reader/`)
      console.log('Headers:', {
        'Authorization': `Token ${PLATE_RECOGNIZER_CONFIG.API_TOKEN}`,
        'Accept': 'application/json',
      })

      const response = await fetch(`${PLATE_RECOGNIZER_CONFIG.BASE_URL}/plate-reader/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${PLATE_RECOGNIZER_CONFIG.API_TOKEN}`,
          'Accept': 'application/json',
        },
        body: formData,
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response not OK:', response.status, errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      console.log('Plate Recognizer Response:', JSON.stringify(data, null, 2))

      const results = data.results
      if (results && results.length > 0) {
        const result = results[0]
        console.log('First result:', JSON.stringify(result, null, 2))
        
        // Extraer información básica
        const plate = result.plate
        const confidence = result.score * 100
        
        // Extraer información del vehículo si está disponible
        const vehicle = result.vehicle || {}
        const make = vehicle.make_model?.[0]?.make || ''
        const model = vehicle.make_model?.[0]?.model || ''
        const color = vehicle.color?.[0]?.name || ''

        console.log('Extracted data:', { plate, confidence, make, model, color })

        return {
          plate: plate.toUpperCase(),
          confidence,
          brand: make,
          model: model,
          color: color
        }
      }

      return null
    } catch (error) {
      console.error('Error recognizing plate with fetch:', error)
      return null
    }
  }

  /**
   * Prueba la conexión con la API usando la imagen de demo oficial
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing connection with fetch...')
      const result = await this.recognizePlate('https://app.platerecognizer.com/static/demo.jpg')
      console.log('Connection test result:', result)
      return result !== null
    } catch (error) {
      console.error('Connection test failed with fetch:', error)
      return false
    }
  }
}

export const plateRecognizerService = new PlateRecognizerService()
