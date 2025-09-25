# OneSignal Integration - API Backend Implementation

## 📋 Overview

This document contains the implementation instructions for integrating OneSignal push notifications into the Carman API backend. The goal is to send push notifications when a vehicle changes state to "SOLICITADO" (Requested).

## 🔑 OneSignal Configuration

### App ID
```
2e8adea2-edb7-425c-acda-17df0ef92d9f
```

### REST API Key
- **Location**: OneSignal Dashboard → Settings → Keys & IDs
- **Key**: REST API Key (Basic Auth)
- **Format**: `Basic YOUR_REST_API_KEY`

## 🚀 Implementation Steps

### 1. Install Dependencies

```bash
# Node.js
npm install axios

# Python
pip install requests

# PHP
composer require guzzlehttp/guzzle
```

### 2. API Endpoint Implementation

#### Node.js/Express Example

```javascript
const axios = require('axios');

// OneSignal configuration
const ONESIGNAL_CONFIG = {
  APP_ID: '2e8adea2-edb7-425c-acda-17df0ef92d9f',
  REST_API_KEY: 'YOUR_REST_API_KEY', // Get from OneSignal dashboard
  API_URL: 'https://onesignal.com/api/v1/notifications'
};

// Function to send notification to OneSignal
async function sendOneSignalNotification(notificationData) {
  try {
    const response = await axios.post(ONESIGNAL_CONFIG.API_URL, {
      app_id: ONESIGNAL_CONFIG.APP_ID,
      filters: [
        {
          field: 'tag',
          key: 'establishment_id',
          relation: '=',
          value: notificationData.establishmentId
        }
      ],
      headings: { en: notificationData.title },
      contents: { en: notificationData.message },
      data: notificationData.data,
      url: notificationData.url || null, // Optional deep link
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_CONFIG.REST_API_KEY}`
      }
    });

    console.log('✅ OneSignal notification sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending OneSignal notification:', error.response?.data || error.message);
    throw error;
  }
}

// Vehicle entry endpoint (POST /api/vehicles)
app.post('/api/vehicles', async (req, res) => {
  try {
    const {
      patente,
      sector,
      nroLlave,
      marca,
      modelo,
      color,
      nombreConductor,
      telefono,
      quienSeLleva, // NEW FIELD: Who takes the vehicle
      establecimientoId
    } = req.body;
    
    // Create vehicle in database
    const vehicle = await createVehicle({
      patente,
      sector,
      nroLlave,
      marca,
      modelo,
      color,
      nombreConductor,
      telefono,
      quienSeLleva, // Store the field
      establecimientoId,
      estado: 'INGRESADO',
      horaIngreso: new Date()
    });
    
    res.json({ success: true, vehicle });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vehicle state update endpoint
app.put('/api/vehicles/:id/state', async (req, res) => {
  try {
    const { estado } = req.body;
    const vehicleId = req.params.id;
    
    // Update vehicle state in database
    const vehicle = await updateVehicleState(vehicleId, estado);
    
    // Send notification if vehicle is requested
    if (estado === 'SOLICITADO') {
      await sendOneSignalNotification({
        title: '🚗 Vehículo Solicitado',
        message: `Vehículo ${vehicle.patente} solicitado en ${vehicle.establecimiento.nombre}`,
        establishmentId: vehicle.establecimiento._id,
        data: {
          type: 'vehicle_requested',
          plate: vehicle.patente,
          establishmentName: vehicle.establecimiento.nombre,
          establishmentId: vehicle.establecimiento._id,
          vehicleId: vehicle._id,
          quienSeLleva: vehicle.quienSeLleva, // Include who takes the vehicle
          timestamp: new Date().toISOString(),
        },
        url: `carman://vehicle/${vehicle._id}` // Deep link to vehicle details
      });
    }
    
    res.json({ success: true, vehicle });
  } catch (error) {
    console.error('Error updating vehicle state:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### Python/Flask Example

```python
import requests
import json
from datetime import datetime

# OneSignal configuration
ONESIGNAL_CONFIG = {
    'APP_ID': '2e8adea2-edb7-425c-acda-17df0ef92d9f',
    'REST_API_KEY': 'YOUR_REST_API_KEY',  # Get from OneSignal dashboard
    'API_URL': 'https://onesignal.com/api/v1/notifications'
}

def send_onesignal_notification(notification_data):
    """Send notification to OneSignal"""
    try:
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Basic {ONESIGNAL_CONFIG["REST_API_KEY"]}'
        }
        
        payload = {
            'app_id': ONESIGNAL_CONFIG['APP_ID'],
            'filters': [
                {
                    'field': 'tag',
                    'key': 'establishment_id',
                    'relation': '=',
                    'value': notification_data['establishmentId']
                }
            ],
            'headings': {'en': notification_data['title']},
            'contents': {'en': notification_data['message']},
            'data': notification_data['data']
        }
        
        response = requests.post(
            ONESIGNAL_CONFIG['API_URL'],
            headers=headers,
            data=json.dumps(payload)
        )
        
        response.raise_for_status()
        print('✅ OneSignal notification sent:', response.json())
        return response.json()
        
    except requests.exceptions.RequestException as e:
        print('❌ Error sending OneSignal notification:', e)
        raise

# Vehicle entry endpoint
@app.route('/api/vehicles', methods=['POST'])
def create_vehicle():
    try:
        data = request.get_json()
        
        # Extract all fields including quienSeLleva
        vehicle_data = {
            'patente': data.get('patente'),
            'sector': data.get('sector'),
            'nroLlave': data.get('nroLlave'),
            'marca': data.get('marca'),
            'modelo': data.get('modelo'),
            'color': data.get('color'),
            'nombreConductor': data.get('nombreConductor'),
            'telefono': data.get('telefono'),
            'quienSeLleva': data.get('quienSeLleva'),  # NEW FIELD
            'establecimientoId': data.get('establecimientoId'),
            'estado': 'INGRESADO',
            'horaIngreso': datetime.now()
        }
        
        # Create vehicle in database
        vehicle = create_vehicle_db(vehicle_data)
        
        return jsonify({'success': True, 'vehicle': vehicle})
        
    except Exception as e:
        print('Error creating vehicle:', e)
        return jsonify({'error': 'Internal server error'}), 500

# Vehicle state update endpoint
@app.route('/api/vehicles/<vehicle_id>/state', methods=['PUT'])
def update_vehicle_state(vehicle_id):
    try:
        data = request.get_json()
        estado = data.get('estado')
        
        # Update vehicle state in database
        vehicle = update_vehicle_state_db(vehicle_id, estado)
        
        # Send notification if vehicle is requested
        if estado == 'SOLICITADO':
            send_onesignal_notification({
                'title': '🚗 Vehículo Solicitado',
                'message': f'Vehículo {vehicle.patente} solicitado en {vehicle.establecimiento.nombre}',
                'establishmentId': vehicle.establecimiento._id,
                'data': {
                    'type': 'vehicle_requested',
                    'plate': vehicle.patente,
                    'establishmentName': vehicle.establecimiento.nombre,
                    'establishmentId': vehicle.establecimiento._id,
                    'vehicleId': vehicle._id,
                    'quienSeLleva': vehicle.quienSeLleva,  # Include who takes the vehicle
                    'timestamp': datetime.now().isoformat()
                }
            })
        
        return jsonify({'success': True, 'vehicle': vehicle})
        
    except Exception as e:
        print('Error updating vehicle state:', e)
        return jsonify({'error': 'Internal server error'}), 500
```

#### PHP/Laravel Example

```php
<?php

// OneSignal configuration
class OneSignalConfig
{
    const APP_ID = '2e8adea2-edb7-425c-acda-17df0ef92d9f';
    const REST_API_KEY = 'YOUR_REST_API_KEY'; // Get from OneSignal dashboard
    const API_URL = 'https://onesignal.com/api/v1/notifications';
}

class OneSignalService
{
    public static function sendNotification($notificationData)
    {
        $headers = [
            'Content-Type: application/json',
            'Authorization: Basic ' . OneSignalConfig::REST_API_KEY
        ];
        
        $payload = [
            'app_id' => OneSignalConfig::APP_ID,
            'filters' => [
                [
                    'field' => 'tag',
                    'key' => 'establishment_id',
                    'relation' => '=',
                    'value' => $notificationData['establishmentId']
                ]
            ],
            'headings' => ['en' => $notificationData['title']],
            'contents' => ['en' => $notificationData['message']],
            'data' => $notificationData['data']
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, OneSignalConfig::API_URL);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            echo "✅ OneSignal notification sent: " . $response;
            return json_decode($response, true);
        } else {
            echo "❌ Error sending OneSignal notification: " . $response;
            throw new Exception('Failed to send notification');
        }
    }
}

// Vehicle entry endpoint
Route::post('/api/vehicles', function (Request $request) {
    try {
        // Validate and extract all fields including quienSeLleva
        $vehicleData = $request->validate([
            'patente' => 'required|string',
            'sector' => 'required|string',
            'nroLlave' => 'required|integer',
            'marca' => 'nullable|string',
            'modelo' => 'nullable|string',
            'color' => 'nullable|string',
            'nombreConductor' => 'nullable|string',
            'telefono' => 'nullable|string',
            'quienSeLleva' => 'nullable|string',  // NEW FIELD
            'establecimientoId' => 'required|string'
        ]);
        
        // Create vehicle in database
        $vehicle = Vehicle::create([
            'patente' => $vehicleData['patente'],
            'sector' => $vehicleData['sector'],
            'nroLlave' => $vehicleData['nroLlave'],
            'marca' => $vehicleData['marca'],
            'modelo' => $vehicleData['modelo'],
            'color' => $vehicleData['color'],
            'nombreConductor' => $vehicleData['nombreConductor'],
            'telefono' => $vehicleData['telefono'],
            'quienSeLleva' => $vehicleData['quienSeLleva'],  // Store the field
            'establecimientoId' => $vehicleData['establecimientoId'],
            'estado' => 'INGRESADO',
            'horaIngreso' => now()
        ]);
        
        return response()->json(['success' => true, 'vehicle' => $vehicle]);
        
    } catch (Exception $e) {
        return response()->json(['error' => 'Internal server error'], 500);
    }
});

// Vehicle state update endpoint
Route::put('/api/vehicles/{id}/state', function ($id, Request $request) {
    try {
        $estado = $request->input('estado');
        
        // Update vehicle state in database
        $vehicle = Vehicle::find($id);
        $vehicle->estado = $estado;
        $vehicle->save();
        
        // Send notification if vehicle is requested
        if ($estado === 'SOLICITADO') {
            OneSignalService::sendNotification([
                'title' => '🚗 Vehículo Solicitado',
                'message' => "Vehículo {$vehicle->patente} solicitado en {$vehicle->establecimiento->nombre}",
                'establishmentId' => $vehicle->establecimiento->_id,
                'data' => [
                    'type' => 'vehicle_requested',
                    'plate' => $vehicle->patente,
                    'establishmentName' => $vehicle->establecimiento->nombre,
                    'establishmentId' => $vehicle->establecimiento->_id,
                    'vehicleId' => $vehicle->_id,
                    'quienSeLleva' => $vehicle->quienSeLleva,  // Include who takes the vehicle
                    'timestamp' => now()->toISOString()
                ]
            ]);
        }
        
        return response()->json(['success' => true, 'vehicle' => $vehicle]);
        
    } catch (Exception $e) {
        return response()->json(['error' => 'Internal server error'], 500);
    }
});
```

## 🗄️ Database Schema Updates

### Vehicle Table
Add the following field to your vehicle table:

```sql
-- Add quienSeLleva field to vehicles table
ALTER TABLE vehicles ADD COLUMN quienSeLleva VARCHAR(255) NULL;

-- Or for MongoDB
// Add to vehicle schema
{
  "quienSeLleva": {
    "type": "String",
    "required": false,
    "maxlength": 255
  }
}
```

### API Request/Response Examples

#### Vehicle Entry Request
```json
{
  "patente": "ABC123",
  "sector": "A1",
  "nroLlave": 15,
  "marca": "Toyota",
  "modelo": "Corolla",
  "color": "Blanco",
  "nombreConductor": "Juan Pérez",
  "telefono": "1234567890",
  "quienSeLleva": "María González",
  "establecimientoId": "est_123"
}
```

#### Vehicle Entry Response
```json
{
  "success": true,
  "vehicle": {
    "_id": "vehicle_123",
    "patente": "ABC123",
    "sector": "A1",
    "nroLlave": 15,
    "marca": "Toyota",
    "modelo": "Corolla",
    "color": "Blanco",
    "nombreConductor": "Juan Pérez",
    "telefono": "1234567890",
    "quienSeLleva": "María González",
    "establecimientoId": "est_123",
    "estado": "INGRESADO",
    "horaIngreso": "2024-01-15T10:30:00.000Z"
  }
}
```

## Notification Data Structure

### Required Fields
```json
{
  "title": "🚗 Vehículo Solicitado",
  "message": "Vehículo ABC123 solicitado en Establecimiento XYZ",
  "establishmentId": "establishment_id_here",
  "data": {
    "type": "vehicle_requested",
    "plate": "ABC123",
    "establishmentName": "Establecimiento XYZ",
    "establishmentId": "establishment_id_here",
    "vehicleId": "vehicle_id_here",
    "quienSeLleva": "María González",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Optional Fields
```json
{
  "url": "carman://vehicle/vehicle_id_here", // Deep link
  "sound": "default",
  "badge": 1,
  "priority": 10
}
```

## 🔧 Advanced Configuration

### 1. User Segmentation
```javascript
// Send to specific establishment
filters: [
  {
    field: 'tag',
    key: 'establishment_id',
    relation: '=',
    value: establishmentId
  }
]

// Send to multiple establishments
filters: [
  {
    field: 'tag',
    key: 'establishment_id',
    relation: 'in',
    value: [establishmentId1, establishmentId2]
  }
]

// Send to all users
included_segments: ['All']
```

### 2. Notification Scheduling
```javascript
// Send immediately
send_after: null

// Send after 5 minutes
send_after: new Date(Date.now() + 5 * 60 * 1000).toISOString()

// Send at specific time
send_after: '2024-01-15T15:30:00.000Z'
```

### 3. Deep Linking
```javascript
// Add deep link to notification
url: `carman://vehicle/${vehicleId}`

// Or web URL
url: `https://carman.com/vehicle/${vehicleId}`
```

## 📱 Mobile App Integration

### User Tagging
The mobile app automatically tags users with:
```javascript
{
  establishment_id: "establishment_id",
  establishment_name: "establishment_name",
  user_id: "user_id"
}
```

### Notification Handling
The mobile app handles notifications with:
```javascript
// Notification opened
OneSignal.setNotificationOpenedHandler((notification) => {
  const data = notification.notification.additionalData;
  if (data?.type === 'vehicle_requested') {
    // Navigate to vehicle details
    navigateToVehicle(data.vehicleId);
  }
});
```

## 🧪 Testing

### 1. Test Vehicle Entry
```bash
curl -X POST http://your-api.com/api/vehicles \
  -H "Content-Type: application/json" \
  -d '{
    "patente": "TEST123",
    "sector": "A1",
    "nroLlave": 1,
    "marca": "Test",
    "modelo": "Test",
    "color": "Test",
    "nombreConductor": "Test Driver",
    "telefono": "1234567890",
    "quienSeLleva": "Test Person",
    "establecimientoId": "test_establishment"
  }'
```

### 2. Test Notification
```bash
curl -X POST https://onesignal.com/api/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_REST_API_KEY" \
  -d '{
    "app_id": "2e8adea2-edb7-425c-acda-17df0ef92d9f",
    "included_segments": ["All"],
    "headings": {"en": "Test Notification"},
    "contents": {"en": "This is a test notification"}
  }'
```

### 3. Test with Specific User
```bash
curl -X POST https://onesignal.com/api/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_REST_API_KEY" \
  -d '{
    "app_id": "2e8adea2-edb7-425c-acda-17df0ef92d9f",
    "filters": [
      {
        "field": "tag",
        "key": "establishment_id",
        "relation": "=",
        "value": "test_establishment_id"
      }
    ],
    "headings": {"en": "Test Notification"},
    "contents": {"en": "This is a test notification for specific establishment"}
  }'
```

## 📊 Monitoring and Analytics

### 1. OneSignal Dashboard
- Monitor notification delivery rates
- Track open rates and click-through rates
- View user engagement metrics

### 2. API Response
```json
{
  "id": "notification_id",
  "recipients": 150,
  "external_id": null,
  "errors": []
}
```

## 🔒 Security Considerations

### 1. API Key Security
- Store REST API key in environment variables
- Never commit API keys to version control
- Use different keys for development/production

### 2. Rate Limiting
- OneSignal has rate limits (check documentation)
- Implement retry logic with exponential backoff
- Monitor API usage

### 3. Data Validation
- Validate all input data before sending
- Sanitize user-generated content
- Implement proper error handling

## 📚 Additional Resources

- [OneSignal REST API Documentation](https://documentation.onesignal.com/reference/create-notification)
- [OneSignal Dashboard](https://app.onesignal.com)
- [OneSignal Webhooks](https://documentation.onesignal.com/docs/webhooks)
- [OneSignal Rate Limits](https://documentation.onesignal.com/docs/rate-limits)

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check REST API key
   - Verify API key format (Basic auth)

2. **400 Bad Request**
   - Validate JSON payload
   - Check required fields
   - Verify app_id

3. **429 Too Many Requests**
   - Implement rate limiting
   - Add retry logic
   - Check OneSignal limits

### Debug Mode
```javascript
// Enable debug logging
console.log('Sending notification:', JSON.stringify(payload, null, 2));
console.log('OneSignal response:', response.data);
```

---

**Note**: Replace `YOUR_REST_API_KEY` with the actual REST API key from your OneSignal dashboard.

**Contact**: For questions or issues, contact the development team.
