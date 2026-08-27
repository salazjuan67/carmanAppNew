# Implementación de Tarjetas Físicas - Backend

## Descripción General

Este documento describe la implementación del sistema de tarjetas físicas con QR para el sistema de valet parking. Las tarjetas siguen una codificación específica: **C** (Carman) + **Letra del Establecimiento** + **Número** (ej: CM101, CM102, etc.).

## Características del Sistema

- **Codificación automática**: C + Letra del establecimiento + Número (empezando desde 101)
- **Asignación inteligente**: Prioriza tarjetas de menor número, reutiliza tarjetas liberadas
- **Flexibilidad**: El cliente puede elegir entre tarjeta física o solo QR digital
- **Trazabilidad**: Cada tarjeta tiene un QR único vinculado al ingreso

## 1. Modelo de Base de Datos

### PhysicalCard Schema

```javascript
// models/PhysicalCard.js
const mongoose = require('mongoose');

const physicalCardSchema = new mongoose.Schema({
  cardNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  qrCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAssigned: {
    type: Boolean,
    default: false
  },
  assignedVehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  establishmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Establishment',
    required: true
  },
  establishmentCode: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PhysicalCard', physicalCardSchema);
```

### Actualizar Vehicle Schema (Opcional)

```javascript
// models/Vehicle.js - Agregar estos campos al schema existente
const vehicleSchema = new mongoose.Schema({
  // ... campos existentes ...
  
  // Campos para tarjeta física (opcional)
  physicalCardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhysicalCard',
    default: null
  },
  physicalCardNumber: {
    type: String,
    default: null
  },
  qrCode: {
    type: String,
    default: null
  },
  noPhysicalCard: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});
```

## 2. Controlador de Tarjetas Físicas

```javascript
// controllers/physicalCardController.js
const PhysicalCard = require('../models/PhysicalCard');
const Vehicle = require('../models/Vehicle');

// Función para generar código de establecimiento
function getEstablishmentCode(establishmentName) {
  const firstLetter = establishmentName.charAt(0).toUpperCase();
  const usedCodes = ['C']; // C siempre está reservado para Carman
  
  if (!usedCodes.includes(firstLetter)) {
    return firstLetter;
  }
  
  // Si la primera letra ya está usada, buscar la siguiente disponible
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const firstIndex = alphabet.indexOf(firstLetter);
  
  for (let i = firstIndex + 1; i < alphabet.length; i++) {
    if (!usedCodes.includes(alphabet[i])) {
      return alphabet[i];
    }
  }
  
  return 'Z'; // Fallback
}

// Asignar automáticamente la próxima tarjeta disponible
exports.assignNextAvailableCard = async (req, res) => {
  try {
    const { establishmentId, establishmentName } = req.body;
    
    if (!establishmentId || !establishmentName) {
      return res.status(400).json({
        success: false,
        message: 'establishmentId y establishmentName son requeridos'
      });
    }

    const establishmentCode = getEstablishmentCode(establishmentName);
    const prefix = `C${establishmentCode}`;
    
    // Buscar tarjetas existentes para este establecimiento
    const existingCards = await PhysicalCard.find({
      establishmentId,
      cardNumber: { $regex: `^${prefix}` }
    }).sort({ cardNumber: 1 });
    
    // Encontrar el próximo número disponible
    let nextNumber = 101; // Empezar desde 101
    
    for (const card of existingCards) {
      const cardNumber = parseInt(card.cardNumber.replace(prefix, ''));
      if (cardNumber === nextNumber) {
        nextNumber++;
      } else if (cardNumber > nextNumber) {
        break;
      }
    }
    
    // Crear nueva tarjeta
    const cardNumber = `${prefix}${nextNumber}`;
    const qrCode = `${prefix}${nextNumber}${Date.now()}`; // QR único
    
    const newCard = new PhysicalCard({
      cardNumber,
      qrCode,
      isActive: true,
      isAssigned: true,
      establishmentId,
      establishmentCode,
      assignedAt: new Date()
    });
    
    await newCard.save();
    
    res.json({
      success: true,
      assignedCard: newCard,
      message: `Tarjeta ${cardNumber} asignada exitosamente`
    });
    
  } catch (error) {
    console.error('Error assigning card:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Liberar tarjeta cuando se entrega el vehículo
exports.releaseCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    
    const card = await PhysicalCard.findById(cardId);
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }
    
    // Liberar la tarjeta
    card.isAssigned = false;
    card.assignedVehicleId = null;
    card.assignedAt = null;
    
    await card.save();
    
    res.json({
      success: true,
      message: 'Tarjeta liberada exitosamente'
    });
    
  } catch (error) {
    console.error('Error releasing card:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener tarjetas disponibles para un establecimiento
exports.getAvailableCards = async (req, res) => {
  try {
    const { establishmentId } = req.query;
    
    if (!establishmentId) {
      return res.status(400).json({
        success: false,
        message: 'establishmentId es requerido'
      });
    }
    
    const availableCards = await PhysicalCard.find({
      establishmentId,
      isActive: true,
      isAssigned: false
    }).sort({ cardNumber: 1 });
    
    res.json(availableCards);
    
  } catch (error) {
    console.error('Error getting available cards:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener tarjeta por QR code
exports.getCardByQR = async (req, res) => {
  try {
    const { qrCode } = req.params;
    
    const card = await PhysicalCard.findOne({ qrCode });
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }
    
    res.json(card);
    
  } catch (error) {
    console.error('Error getting card by QR:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener tarjeta por número
exports.getCardByNumber = async (req, res) => {
  try {
    const { cardNumber } = req.params;
    
    const card = await PhysicalCard.findOne({ cardNumber });
    if (!card) {
      return res.status(404).json({
        success: false,
        message: 'Tarjeta no encontrada'
      });
    }
    
    res.json(card);
    
  } catch (error) {
    console.error('Error getting card by number:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear tarjetas iniciales para un establecimiento
exports.createInitialCards = async (req, res) => {
  try {
    const { establishmentId, establishmentName, quantity = 50 } = req.body;
    
    if (!establishmentId || !establishmentName) {
      return res.status(400).json({
        success: false,
        message: 'establishmentId y establishmentName son requeridos'
      });
    }
    
    const establishmentCode = getEstablishmentCode(establishmentName);
    const prefix = `C${establishmentCode}`;
    
    const cards = [];
    
    for (let i = 101; i < 101 + quantity; i++) {
      const cardNumber = `${prefix}${i}`;
      const qrCode = `${prefix}${i}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      const card = new PhysicalCard({
        cardNumber,
        qrCode,
        isActive: true,
        isAssigned: false,
        establishmentId,
        establishmentCode
      });
      
      cards.push(card);
    }
    
    await PhysicalCard.insertMany(cards);
    
    res.json({
      success: true,
      message: `${quantity} tarjetas creadas para ${establishmentName}`,
      cardsCreated: quantity
    });
    
  } catch (error) {
    console.error('Error creating initial cards:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
```

## 3. Rutas de la API

```javascript
// routes/physicalCards.js
const express = require('express');
const router = express.Router();
const physicalCardController = require('../controllers/physicalCardController');

// Asignar automáticamente la próxima tarjeta disponible
router.post('/assign-next', physicalCardController.assignNextAvailableCard);

// Liberar tarjeta
router.post('/:cardId/release', physicalCardController.releaseCard);

// Obtener tarjetas disponibles
router.get('/available', physicalCardController.getAvailableCards);

// Obtener tarjeta por QR
router.get('/qr/:qrCode', physicalCardController.getCardByQR);

// Obtener tarjeta por número
router.get('/number/:cardNumber', physicalCardController.getCardByNumber);

// Crear tarjetas iniciales (para setup inicial)
router.post('/create-initial', physicalCardController.createInitialCards);

module.exports = router;
```

## 4. Integración en la Aplicación Principal

```javascript
// app.js o server.js
const physicalCardRoutes = require('./routes/physicalCards');

// Usar las rutas
app.use('/api/physical-cards', physicalCardRoutes);
```

## 5. Script para Crear Tarjetas Iniciales

```javascript
// scripts/createInitialCards.js
const mongoose = require('mongoose');
const PhysicalCard = require('../models/PhysicalCard');
const Establishment = require('../models/Establishment');

async function createInitialCards() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const establishments = await Establishment.find({ active: true });
    
    for (const establishment of establishments) {
      const establishmentCode = getEstablishmentCode(establishment.nombre);
      const prefix = `C${establishmentCode}`;
      
      // Verificar si ya existen tarjetas para este establecimiento
      const existingCards = await PhysicalCard.countDocuments({
        establishmentId: establishment._id
      });
      
      if (existingCards === 0) {
        const cards = [];
        
        for (let i = 101; i <= 200; i++) { // Crear 100 tarjetas por establecimiento
          const cardNumber = `${prefix}${i}`;
          const qrCode = `${prefix}${i}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
          
          cards.push({
            cardNumber,
            qrCode,
            isActive: true,
            isAssigned: false,
            establishmentId: establishment._id,
            establishmentCode
          });
        }
        
        await PhysicalCard.insertMany(cards);
        console.log(`✅ Creadas 100 tarjetas para ${establishment.nombre}`);
      } else {
        console.log(`⚠️ Ya existen tarjetas para ${establishment.nombre}`);
      }
    }
    
    console.log('🎉 Proceso completado');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function getEstablishmentCode(establishmentName) {
  const firstLetter = establishmentName.charAt(0).toUpperCase();
  const usedCodes = ['C'];
  
  if (!usedCodes.includes(firstLetter)) {
    return firstLetter;
  }
  
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const firstIndex = alphabet.indexOf(firstLetter);
  
  for (let i = firstIndex + 1; i < alphabet.length; i++) {
    if (!usedCodes.includes(alphabet[i])) {
      return alphabet[i];
    }
  }
  
  return 'Z';
}

createInitialCards();
```

## 6. Endpoints de la API

### POST `/api/physical-cards/assign-next`
Asigna automáticamente la próxima tarjeta disponible.

**Request Body:**
```json
{
  "establishmentId": "507f1f77bcf86cd799439011",
  "establishmentName": "Malloys"
}
```

**Response:**
```json
{
  "success": true,
  "assignedCard": {
    "_id": "507f1f77bcf86cd799439012",
    "cardNumber": "CM101",
    "qrCode": "CM1011703123456789",
    "isActive": true,
    "isAssigned": true,
    "establishmentId": "507f1f77bcf86cd799439011",
    "establishmentCode": "M",
    "assignedAt": "2023-12-21T10:30:00.000Z"
  },
  "message": "Tarjeta CM101 asignada exitosamente"
}
```

### POST `/api/physical-cards/:cardId/release`
Libera una tarjeta cuando se entrega el vehículo.

**Response:**
```json
{
  "success": true,
  "message": "Tarjeta liberada exitosamente"
}
```

### GET `/api/physical-cards/available?establishmentId=:id`
Obtiene las tarjetas disponibles para un establecimiento.

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "cardNumber": "CM101",
    "qrCode": "CM1011703123456789",
    "isActive": true,
    "isAssigned": false,
    "establishmentId": "507f1f77bcf86cd799439011",
    "establishmentCode": "M"
  }
]
```

### GET `/api/physical-cards/qr/:qrCode`
Obtiene una tarjeta por su código QR.

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "cardNumber": "CM101",
  "qrCode": "CM1011703123456789",
  "isActive": true,
  "isAssigned": true,
  "assignedVehicleId": "507f1f77bcf86cd799439013",
  "establishmentId": "507f1f77bcf86cd799439011",
  "establishmentCode": "M"
}
```

### GET `/api/physical-cards/number/:cardNumber`
Obtiene una tarjeta por su número.

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "cardNumber": "CM101",
  "qrCode": "CM1011703123456789",
  "isActive": true,
  "isAssigned": true,
  "assignedVehicleId": "507f1f77bcf86cd799439013",
  "establishmentId": "507f1f77bcf86cd799439011",
  "establishmentCode": "M"
}
```

### POST `/api/physical-cards/create-initial`
Crea tarjetas iniciales para un establecimiento.

**Request Body:**
```json
{
  "establishmentId": "507f1f77bcf86cd799439011",
  "establishmentName": "Malloys",
  "quantity": 100
}
```

**Response:**
```json
{
  "success": true,
  "message": "100 tarjetas creadas para Malloys",
  "cardsCreated": 100
}
```

## 7. Comandos para Ejecutar

```bash
# 1. Crear el modelo PhysicalCard
# Copiar el código del modelo en models/PhysicalCard.js

# 2. Crear el controlador
# Copiar el código del controlador en controllers/physicalCardController.js

# 3. Crear las rutas
# Copiar el código de las rutas en routes/physicalCards.js

# 4. Integrar las rutas en app.js
# Agregar: app.use('/api/physical-cards', physicalCardRoutes);

# 5. Crear el script de inicialización
# Copiar el código del script en scripts/createInitialCards.js

# 6. Ejecutar el script para crear tarjetas iniciales
node scripts/createInitialCards.js
```

## 8. Lógica de Codificación

### Ejemplos de Codificación:

- **Malloys**: CM101, CM102, CM103, ...
- **Shopping**: CS101, CS102, CS103, ...
- **Centro**: CC101, CC102, CC103, ...
- **Plaza**: CP101, CP102, CP103, ...

### Reglas de Asignación:

1. **Prioridad de números**: Siempre asigna el número más bajo disponible
2. **Reutilización**: Si se libera la CM100, la próxima asignación será CM100 (no CM103)
3. **Código de establecimiento**: Si la primera letra ya está usada, usar la siguiente disponible
4. **Rango**: Los números van desde 101 en adelante

## 9. Flujo de Trabajo

1. **Cliente llega**: El valet pregunta si quiere tarjeta física o solo QR
2. **Si quiere tarjeta**: Se llama a `/assign-next` para obtener la próxima tarjeta disponible
3. **Se asigna tarjeta**: El sistema devuelve el número de tarjeta (ej: CM101)
4. **Valet busca tarjeta**: Busca la tarjeta física con ese número
5. **Cliente se va**: Con la tarjeta física o solo con el QR digital
6. **Cliente regresa**: Escanea el QR (de la tarjeta o del teléfono)
7. **Se entrega vehículo**: Se llama a `/release` para liberar la tarjeta

## 10. Consideraciones de Seguridad

- **Validación de entrada**: Verificar que establishmentId y establishmentName sean válidos
- **Autenticación**: Proteger los endpoints con middleware de autenticación
- **Autorización**: Verificar que el usuario tenga permisos para el establecimiento
- **Rate limiting**: Implementar límites de velocidad para evitar abuso
- **Logging**: Registrar todas las operaciones de asignación y liberación

## 11. Testing

```javascript
// tests/physicalCards.test.js
const request = require('supertest');
const app = require('../app');

describe('Physical Cards API', () => {
  test('should assign next available card', async () => {
    const response = await request(app)
      .post('/api/physical-cards/assign-next')
      .send({
        establishmentId: '507f1f77bcf86cd799439011',
        establishmentName: 'Malloys'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.assignedCard.cardNumber).toMatch(/^CM\d{3}$/);
  });
  
  test('should release card', async () => {
    const response = await request(app)
      .post('/api/physical-cards/507f1f77bcf86cd799439012/release');
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## 12. Monitoreo y Mantenimiento

- **Dashboard**: Crear un panel para ver el estado de las tarjetas
- **Reportes**: Generar reportes de uso de tarjetas por establecimiento
- **Limpieza**: Script para limpiar tarjetas inactivas o duplicadas
- **Backup**: Incluir las tarjetas en el proceso de backup de la base de datos

---

**Nota**: Este sistema es completamente opcional. Si el cliente no quiere tarjeta física, simplemente no se asigna ninguna y se usa el QR digital normal del vehículo.











