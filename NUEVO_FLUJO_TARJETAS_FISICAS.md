# 🔄 Nuevo Flujo de Asignación de Tarjetas Físicas

**Versión**: 2.1  
**Fecha**: Octubre 2025  
**Estado**: ✅ Implementado en Frontend  

---

## 🔍 Contexto Importante: Vehículo vs Ingreso

### ⚠️ Entender la Diferencia

El sistema Carman maneja **DOS entidades separadas**:

1. **Vehículo** (`Vehiculo`): 
   - Representa el auto físico permanente
   - Se crea UNA VEZ y se reutiliza
   - Tiene: patente, marca, modelo, color, datos del dueño
   - Ejemplo: Toyota Corolla ABC123

2. **Ingreso** (`IngresoVehiculo`):
   - Representa CADA VISITA del vehículo al estacionamiento
   - Se crea cada vez que el auto entra
   - Tiene: fecha, hora, sector, llave, estado, turno
   - Ejemplo: ABC123 ingresó hoy a las 10:30 en sector A1

### 🔄 Proceso de Creación en Backend

Cuando el frontend hace `POST /api/vehiculos/ingresos`:

```javascript
// El backend automáticamente:
1. Busca si existe el vehículo: Vehiculo.findOne({ patente: "ABC123" })

2a. Si NO existe:
    - Crea el vehículo nuevo con los datos enviados
    - Guarda en colección 'vehiculos'
    
2b. Si SÍ existe:
    - Usa el vehículo existente
    - Puede actualizar datos si cambiaron

3. Crea el INGRESO vinculado a ese vehículo
   - Guarda en colección 'ingresosvehiculos'
   - Incluye: sector, llave, hora, turno, estado

4. Responde con el INGRESO creado (que tiene su propio _id)
```

**Por eso:**
- El `vehicleId` que envía el frontend es realmente el `ingresoId`
- El backend debe buscar el ingreso, obtener la patente, y buscar/crear el vehículo
- La tarjeta se vincula tanto al ingreso como al vehículo

---

## 🎯 Cambio de Flujo

### ❌ Flujo Anterior (Causaba Problemas)

```
1. App asigna tarjeta (POST /assign-next)
   → Tarjeta queda asignada pero sin vehicleId
   
2. App crea ingreso con datos de tarjeta
   → Ingreso creado pero tarjeta no vinculada
   
RESULTADO: Tarjetas huérfanas (isAssigned=true, assignedVehicleId=null)
```

### ✅ Nuevo Flujo (Correcto)

```
1. App crea ingreso/vehículo PRIMERO
   → Ingreso creado con ID
   
2. App vincula tarjeta AL vehículo creado
   → Tarjeta vinculada correctamente
   
RESULTADO: Vinculación correcta (assignedVehicleId apunta al vehículo)
```

---

## 📝 Implementación Frontend

### Código Actualizado en VehicleForm.tsx

```typescript
const onSubmit = async (data: VehicleFormDataZod) => {
  // Preparar datos del ingreso (SIN tarjeta todavía)
  const input: VehicleDataWithTime = { 
    ...data, 
    horaIngreso: new Date().toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    // Solo marcar si no quiere tarjeta
    ...(noPhysicalCard && {
      noPhysicalCard: true,
    })
  };

  try {
    // ═══════════════════════════════════════════════════════════
    // PASO 1: CREAR EL INGRESO PRIMERO
    // ═══════════════════════════════════════════════════════════
    console.log('🚗 Paso 1: Creando vehículo/ingreso...');
    const result = await addVehicle(input);
    console.log('✅ Ingreso creado:', result._id);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 2: SI HAY TARJETA, VINCULARLA AL VEHÍCULO
    // ═══════════════════════════════════════════════════════════
    if (assignedCard && result._id) {
      console.log('🏷️ Paso 2: Vinculando tarjeta al vehículo...');
      
      const cardResponse = await physicalCardService.assignToVehicle(
        establishmentId,
        selectedEstablishment?.nombre || 'Establecimiento',
        result._id,      // ← ID del ingreso creado
        data.patente
      );
      
      console.log('✅ Tarjeta vinculada:', cardResponse.assignedCard.cardNumber);
      
      // Actualizar el resultado con la info de la tarjeta
      result.physicalCardId = cardResponse.assignedCard._id;
      result.physicalCardNumber = cardResponse.assignedCard.cardNumber;
      result.qrCode = cardResponse.assignedCard.qrCode;
    }
    
    // Mostrar modal de éxito
    setAddedVehicle(result);
    setShowSuccess(true);
    
  } catch (error) {
    Alert.alert('Error', 'Hubo un problema al agregar el vehículo.');
  }
};
```

---

## 🔌 Nuevo Endpoint Requerido en Backend

### Endpoint
```
POST /api/physical-cards/assign-to-vehicle
```

### Request Body
```json
{
  "establishmentId": "666236d2b6316ac455e22509",
  "establishmentName": "Malloys",
  "vehicleId": "68e7c1234567890abcdef123",    // ← ID del ingreso/vehículo
  "patente": "AG087IF"
}
```

### Implementación del Controller

```javascript
// controllers/physicalCardController.js

exports.assignToVehicle = async (req, res) => {
  try {
    const { establishmentId, establishmentName, vehicleId, patente } = req.body;
    
    // Validaciones
    if (!establishmentId || !vehicleId || !patente) {
      return res.status(400).json({
        success: false,
        message: 'establishmentId, vehicleId y patente son requeridos'
      });
    }
    
    console.log(`🏷️ Asignando tarjeta para vehículo: ${patente} (${vehicleId})`);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 1: BUSCAR TARJETAS DISPONIBLES
    // ═══════════════════════════════════════════════════════════
    const availableCards = await PhysicalCard.find({
      establishmentId: establishmentId,
      isActive: true,
      isAssigned: false
    }).sort({ cardNumber: 1 });
    
    let assignedCard;
    
    // ═══════════════════════════════════════════════════════════
    // PASO 2: SI HAY DISPONIBLES, ASIGNAR LA DE MENOR NÚMERO
    // ═══════════════════════════════════════════════════════════
    if (availableCards.length > 0) {
      assignedCard = availableCards[0];
      assignedCard.isAssigned = true;
      assignedCard.assignedVehicleId = vehicleId;  // ← VINCULAR AQUÍ
      assignedCard.assignedAt = new Date();
      assignedCard.updated_at = new Date();
      await assignedCard.save();
      
      console.log(`♻️ Tarjeta ${assignedCard.cardNumber} reutilizada y vinculada`);
    } 
    // ═══════════════════════════════════════════════════════════
    // PASO 3: SI NO HAY DISPONIBLES, CREAR UNA NUEVA
    // ═══════════════════════════════════════════════════════════
    else {
      const establishmentCode = establishmentName.charAt(0).toUpperCase();
      
      const lastCard = await PhysicalCard.findOne({ 
        establishmentId 
      }).sort({ cardNumber: -1 });
      
      let nextNumber = 101;
      if (lastCard) {
        const match = lastCard.cardNumber.match(/\d+$/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }
      
      const cardNumber = `C${establishmentCode}${nextNumber}`;
      const qrCode = `${cardNumber}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
      
      assignedCard = new PhysicalCard({
        cardNumber,
        qrCode,
        isActive: true,
        isAssigned: true,
        assignedVehicleId: vehicleId,  // ← VINCULAR AQUÍ
        assignedAt: new Date(),
        establishmentId,
        establishmentCode
      });
      
      await assignedCard.save();
      console.log(`✨ Tarjeta ${assignedCard.cardNumber} creada y vinculada`);
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 4: BUSCAR EL INGRESO POR ID (vehicleId es el ingresoId)
    // ═══════════════════════════════════════════════════════════
    const ingreso = await IngresoVehiculo.findById(vehicleId);
    
    if (!ingreso) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }
    
    console.log(`✅ Ingreso encontrado: ${ingreso.patente}`);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 5: BUSCAR O CREAR EL VEHÍCULO
    // ═══════════════════════════════════════════════════════════
    let vehiculo = await Vehiculo.findOne({ patente: ingreso.patente });
    
    if (!vehiculo) {
      console.log(`📝 Vehículo ${ingreso.patente} no existe, creándolo...`);
      
      // Crear el vehículo con los datos del ingreso
      vehiculo = new Vehiculo({
        patente: ingreso.patente,
        marca: ingreso.marca || null,
        modelo: ingreso.modelo || null,
        color: ingreso.color || null,
        nombreConductor: ingreso.nombreConductor || null,
        telefono: ingreso.telefono || null,
        quienSeLleva: ingreso.quienSeLleva || null,
        vip: ingreso.vip || false,
        recurrente: ingreso.recurrente || false,
        inhabilitado: ingreso.inhabilitado || false,
        establecimiento: ingreso.establecimiento,
        // Campos de tarjeta
        physicalCardId: assignedCard._id,
        physicalCardNumber: assignedCard.cardNumber,
        qrCode: assignedCard.qrCode
      });
      
      await vehiculo.save();
      console.log(`✅ Vehículo ${ingreso.patente} creado con tarjeta ${assignedCard.cardNumber}`);
    } else {
      // Actualizar el vehículo existente con la tarjeta
      vehiculo.physicalCardId = assignedCard._id;
      vehiculo.physicalCardNumber = assignedCard.cardNumber;
      vehiculo.qrCode = assignedCard.qrCode;
      await vehiculo.save();
      console.log(`✅ Vehículo ${ingreso.patente} actualizado con tarjeta ${assignedCard.cardNumber}`);
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 6: ACTUALIZAR EL INGRESO CON LA INFORMACIÓN DE TARJETA
    // ═══════════════════════════════════════════════════════════
    ingreso.physicalCardId = assignedCard._id;
    ingreso.physicalCardNumber = assignedCard.cardNumber;
    ingreso.physicalCardQR = assignedCard.qrCode;
    ingreso.hasPhysicalCard = true;
    await ingreso.save();
    console.log(`✅ Ingreso ${vehicleId} actualizado con tarjeta ${assignedCard.cardNumber}`);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 7: RESPONDER
    // ═══════════════════════════════════════════════════════════
    return res.status(200).json({
      success: true,
      assignedCard: assignedCard,
      message: `Tarjeta ${assignedCard.cardNumber} asignada y vinculada exitosamente`
    });
    
  } catch (error) {
    console.error('❌ Error asignando tarjeta a vehículo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al asignar tarjeta física',
      error: error.message
    });
  }
};
```

### Response
```json
{
  "success": true,
  "assignedCard": {
    "_id": "68e59bee0693b68e94404e7c",
    "cardNumber": "CM101",
    "qrCode": "CM1011759878126511",
    "isActive": true,
    "isAssigned": true,
    "assignedVehicleId": "68e7c1234567890abcdef123",  // ← VINCULADO
    "assignedAt": "2025-10-09T10:30:00.000Z",
    "establishmentId": "666236d2b6316ac455e22509",
    "establishmentCode": "M"
  },
  "message": "Tarjeta CM101 asignada y vinculada exitosamente"
}
```

---

## 📊 Comparación Flujos

### Flujo Anterior vs Nuevo

| Paso | Anterior | Nuevo |
|------|----------|-------|
| 1 | Asignar tarjeta → `assignedVehicleId: null` | Crear ingreso → `_id: "123"` |
| 2 | Crear ingreso con datos de tarjeta | Vincular tarjeta → `assignedVehicleId: "123"` |
| Resultado | ❌ Tarjeta huérfana | ✅ Tarjeta vinculada |

---

## 🔧 Ruta en Express

```javascript
// routes/physicalCardRoutes.js

const express = require('express');
const router = express.Router();
const physicalCardController = require('../controllers/physicalCardController');
const authMiddleware = require('../middleware/auth');

// Nuevo endpoint - Asignar tarjeta a vehículo existente
router.post('/assign-to-vehicle', authMiddleware, physicalCardController.assignToVehicle);

// Endpoints existentes
router.post('/assign-next', physicalCardController.assignNextAvailableCard);
router.post('/:cardId/release', authMiddleware, physicalCardController.releaseCard);
router.get('/available', authMiddleware, physicalCardController.getAvailableCards);
router.get('/qr/:qrCode', physicalCardController.getCardByQR);
router.get('/number/:cardNumber', physicalCardController.getCardByNumber);

module.exports = router;
```

---

## 🧪 Testing

### Test Completo del Nuevo Flujo

```bash
# 1. Crear ingreso (sin tarjeta todavía)
curl -X POST https://carmanparking.com/api/vehiculos/ingresos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patente": "ABC123",
    "sector": "A1",
    "nroLlave": 101,
    "establecimiento": "666236d2b6316ac455e22509"
  }'

# Respuesta: { "_id": "INGRESO_ID", "patente": "ABC123", ... }

# 2. Vincular tarjeta al vehículo creado
curl -X POST https://carmanparking.com/api/physical-cards/assign-to-vehicle \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "establishmentId": "666236d2b6316ac455e22509",
    "establishmentName": "Malloys",
    "vehicleId": "INGRESO_ID",
    "patente": "ABC123"
  }'

# Respuesta: 
# {
#   "success": true,
#   "assignedCard": {
#     "cardNumber": "CM101",
#     "assignedVehicleId": "INGRESO_ID"  ← VINCULADO
#   }
# }

# 3. Verificar en MongoDB
db.physicalcards.findOne({ cardNumber: "CM101" })
# assignedVehicleId debe estar poblado

db.ingresosvehiculos.findOne({ patente: "ABC123" })
# physicalCardNumber debe estar poblado
```

---

## 📋 Ventajas del Nuevo Flujo

### ✅ Beneficios

1. **Vinculación Correcta**
   - `assignedVehicleId` siempre apunta al vehículo correcto
   - No hay tarjetas huérfanas

2. **Tolerancia a Fallos**
   - Si falla la asignación de tarjeta, el ingreso ya está creado
   - Se puede usar QR digital como fallback

3. **Rastreabilidad**
   - Siempre se sabe qué tarjeta tiene qué vehículo
   - Fácil hacer queries en MongoDB

4. **Reutilización**
   - Las tarjetas liberadas se pueden rastrear correctamente
   - La priorización funciona bien

### ⚠️ Consideraciones

- El frontend maneja el error si falla la vinculación
- El vehículo se crea igual, solo queda sin tarjeta
- Se muestra alert al valet para usar QR digital

---

## 🎬 Flujo Completo Visual

```
┌─────────────────────────────────────────────────────────┐
│                    NUEVO FLUJO                          │
└─────────────────────────────────────────────────────────┘

FRONTEND                                BACKEND
────────                                ───────

1. Usuario completa formulario
   - Patente: AG087IF
   - Sector: A1
   - Llave: 101
   
2. Usuario toca "Asignar Tarjeta"
   (guarda assignedCard en estado local)
   
3. Usuario toca "Agregar Vehículo"
        │
        ▼
   POST /api/vehiculos/ingresos          
   {                                      → Crea ingreso
     "patente": "AG087IF",               → Crea vehículo (si no existe)
     "sector": "A1",                     → Devuelve: { _id: "123", patente: "AG087IF" }
     ...
   }
        │
        ▼
   ✓ Ingreso creado: ID = "123"
        │
        ▼
4. ¿Hay tarjeta asignada?
   SÍ → Continuar al paso 5
   NO → Fin (solo QR digital)
        │
        ▼
5. POST /api/physical-cards/
   assign-to-vehicle
   {
     "vehicleId": "123",                 → Busca tarjeta disponible
     "patente": "AG087IF",               → Asigna CM101
     "establishmentId": "...",           → assignedVehicleId = "123"
     "establishmentName": "Malloys"      → Actualiza vehículo
   }                                      → Actualiza ingreso
        │                                → Devuelve tarjeta vinculada
        ▼
   ✓ Tarjeta CM101 vinculada al vehículo 123
        │
        ▼
6. Actualizar objeto local del vehículo:
   result.physicalCardNumber = "CM101"
   result.qrCode = "CM1011759878126511"
        │
        ▼
7. Mostrar modal de éxito
   - Patente: AG087IF
   - Tarjeta: CM101
   - QR Code: [código QR]
        │
        ▼
8. En el home se ve:
   - Badge azul 🔵 en la tarjeta
   - Número CM101 visible
```

---

## 🗄️ Cambios en Base de Datos

### Antes (Problema):

```javascript
// Tarjeta
{
  "_id": "card123",
  "cardNumber": "CM101",
  "isAssigned": true,
  "assignedVehicleId": null  // ❌ SIN VINCULAR
}

// Ingreso
{
  "_id": "ingreso123",
  "patente": "AG087IF",
  "physicalCardNumber": "CM101",  // Dato suelto
  "physicalCardId": "card123"     // Dato suelto
}
```

**Problema**: No hay relación bidireccional real.

### Después (Correcto):

```javascript
// Tarjeta
{
  "_id": "card123",
  "cardNumber": "CM101",
  "isAssigned": true,
  "assignedVehicleId": "ingreso123"  // ✅ VINCULADO
}

// Ingreso
{
  "_id": "ingreso123",
  "patente": "AG087IF",
  "physicalCardNumber": "CM101",
  "physicalCardId": "card123"  // ✅ VINCULADO
}

// Vehículo
{
  "_id": "vehiculo789",
  "patente": "AG087IF",
  "physicalCardNumber": "CM101",
  "physicalCardId": "card123"  // ✅ VINCULADO
}
```

**Ventaja**: Relación bidireccional completa.

---

## 📊 Actualización de Modelos

### Modelo: IngresoVehiculo

```javascript
const IngresoVehiculoSchema = new Schema({
  // ... campos existentes ...
  
  // Campos de tarjeta física
  physicalCardId: {
    type: Schema.Types.ObjectId,
    ref: 'PhysicalCard',
    default: null
  },
  physicalCardNumber: {
    type: String,
    default: null,
    index: true
  },
  physicalCardQR: {
    type: String,
    default: null
  },
  hasPhysicalCard: {
    type: Boolean,
    default: false
  },
  noPhysicalCard: {
    type: Boolean,
    default: false
  }
});
```

### Modelo: Vehiculo

```javascript
const VehiculoSchema = new Schema({
  patente: { type: String, required: true, unique: true },
  marca: { type: Schema.Types.ObjectId, ref: 'Marca' },
  modelo: String,
  color: String,
  // ... otros campos ...
  
  // Campos de tarjeta física
  physicalCardId: {
    type: Schema.Types.ObjectId,
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
  }
});
```

---

## 🎯 Resumen de Cambios

### Frontend ✅
- [x] Modificado `VehicleForm.tsx` con nuevo flujo
- [x] Agregado método `assignToVehicle` en servicio
- [x] Manejo de errores mejorado
- [x] Logs detallados para debugging

### Backend ⏳
- [ ] Crear endpoint `POST /api/physical-cards/assign-to-vehicle`
- [ ] Implementar controller `assignToVehicle`
- [ ] Actualizar modelo `IngresoVehiculo` con campos de tarjeta
- [ ] Actualizar modelo `Vehiculo` con campos de tarjeta
- [ ] Agregar ruta en Express

---

## 🚀 Siguiente Paso

**El frontend ya está listo con el nuevo flujo.**

El backend necesita:
1. Implementar el endpoint `/assign-to-vehicle` según este documento
2. Actualizar los modelos con los campos requeridos
3. Probar con los scripts de testing

Una vez implementado, las tarjetas se vincularán correctamente y los badges aparecerán en la app. ✅

---

## 📞 Documentos Relacionados

- `PHYSICAL_CARDS_BACKEND_IMPLEMENTATION.md` - Implementación base
- `PROCESO_INGRESO_VEHICULO_BACKEND.md` - Proceso completo
- `TROUBLESHOOTING_PHYSICAL_CARDS.md` - Solución de problemas

