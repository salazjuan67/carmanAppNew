# 🐛 Debug: Error "Vehículo No Encontrado"

## ❌ Error Reportado

```
Error vehiculo no encontrado
Línea 219 onSubmit VehicleForm
```

---

## 🔍 Análisis del Código Frontend

### Código Actual (Líneas 187-243):

```typescript
const onSubmit = async (data: VehicleFormDataZod) => {
  const input: VehicleDataWithTime = { 
    ...data, 
    horaIngreso: new Date().toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    ...(noPhysicalCard && {
      noPhysicalCard: true,
    })
  };

  try {
    // ════════════════════════════════════════════════════
    // PASO 1: CREAR INGRESO (línea 193)
    // ════════════════════════════════════════════════════
    console.log('🚗 Paso 1: Creando vehículo/ingreso...');
    const result = await addVehicle(input);
    console.log('✅ Ingreso creado:', result);
    
    // result = {
    //   _id: "68e7c123...",     ← ID del INGRESO
    //   patente: "ABC123",
    //   sector: "A1",
    //   ...
    // }
    
    // ════════════════════════════════════════════════════
    // PASO 2: VINCULAR TARJETA (líneas 197-224)
    // ════════════════════════════════════════════════════
    if (assignedCard && result._id) {
      try {
        console.log('🏷️ Paso 2: Vinculando tarjeta al vehículo...');
        console.log('🏷️ Tarjeta:', assignedCard.cardNumber);
        console.log('🏷️ Vehículo ID:', result._id);
        
        // Llamada al backend
        const cardResponse = await physicalCardService.assignToVehicle(
          establishmentId,
          selectedEstablishment?.nombre || 'Establecimiento',
          result._id,       // ← ingresoId (ej: "68e7c123...")
          data.patente      // ← patente (ej: "ABC123")
        );
        
        console.log('✅ Tarjeta vinculada:', cardResponse.assignedCard.cardNumber);
        
        // Actualizar objeto local
        result.physicalCardId = cardResponse.assignedCard._id;
        result.physicalCardNumber = cardResponse.assignedCard.cardNumber;
        result.qrCode = cardResponse.assignedCard.qrCode;
        result.noPhysicalCard = false;
        
      } catch (cardError: any) {  // ← LÍNEA 218-219
        // Si el backend responde con error, entra aquí
        console.error('⚠️ Error vinculando tarjeta:', cardError);
        Alert.alert(
          'Advertencia',
          'El vehículo se creó pero no se pudo asignar la tarjeta física. Use QR digital.'
        );
      }
    }
    
    // Continuar mostrando modal de éxito de todos modos
    setAddedVehicle(result);
    setShowSuccess(true);
    
  } catch (error) {
    console.error('🚗 Error adding vehicle:', error);
    Alert.alert('Error', 'Hubo un problema al agregar el vehículo.');
  }
};
```

---

## 🔍 ¿Dónde Ocurre el Error?

El error **"vehículo no encontrado"** viene del **BACKEND** en la línea donde hace:

```javascript
// Backend: /api/physical-cards/assign-to-vehicle

const vehiculo = await Vehiculo.findOne({ patente: patente.toUpperCase() });

if (!vehiculo) {
  // ❌ Error aquí
  throw new Error('Vehículo no encontrado');
}
```

---

## 🚨 ¿Por Qué Falla?

### Teoría 1: El vehículo no se creó todavía

El ingreso se crea, pero el **vehículo master** aún no existe en la colección `vehiculos`.

**Solución**: El backend debe CREAR el vehículo si no existe (ver código en `NUEVO_FLUJO_TARJETAS_FISICAS.md` líneas 213-235).

### Teoría 2: Timing Issue

Hay un pequeño delay entre que se crea el ingreso y cuando se busca el vehículo.

**Solución**: El backend debe buscar el ingreso primero, obtener la patente, y CREAR el vehículo si no existe.

### Teoría 3: Capitalización de Patente

El vehículo se guardó como "abc123" pero se busca como "ABC123".

**Solución**: Siempre usar `.toUpperCase()` al buscar.

---

## ✅ Código Correcto del Backend

### En el endpoint `/assign-to-vehicle`:

```javascript
exports.assignToVehicle = async (req, res) => {
  try {
    const { vehicleId, patente, establishmentId, establishmentName } = req.body;
    
    console.log('📥 Recibido:', { vehicleId, patente });
    
    // ════════════════════════════════════════════════════
    // PASO 1: BUSCAR EL INGRESO
    // ════════════════════════════════════════════════════
    const ingreso = await IngresoVehiculo.findById(vehicleId);
    
    if (!ingreso) {
      console.error('❌ Ingreso no encontrado:', vehicleId);
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }
    
    console.log('✅ Ingreso encontrado:', ingreso._id, ingreso.patente);
    
    // ════════════════════════════════════════════════════
    // PASO 2: BUSCAR TARJETA DISPONIBLE
    // ════════════════════════════════════════════════════
    const availableCards = await PhysicalCard.find({
      establishmentId,
      isActive: true,
      isAssigned: false
    }).sort({ cardNumber: 1 });
    
    if (availableCards.length === 0) {
      console.log('⚠️ No hay tarjetas disponibles');
      return res.status(404).json({
        success: false,
        message: 'No hay tarjetas disponibles'
      });
    }
    
    const card = availableCards[0];
    console.log('✅ Tarjeta disponible:', card.cardNumber);
    
    // ════════════════════════════════════════════════════
    // PASO 3: ASIGNAR TARJETA
    // ════════════════════════════════════════════════════
    card.isAssigned = true;
    card.assignedVehicleId = vehicleId;  // ← ingresoId
    card.assignedAt = new Date();
    await card.save();
    
    console.log('✅ Tarjeta marcada como asignada');
    
    // ════════════════════════════════════════════════════
    // PASO 4: BUSCAR O CREAR VEHÍCULO
    // ════════════════════════════════════════════════════
    let vehiculo = await Vehiculo.findOne({ 
      patente: ingreso.patente.toUpperCase() 
    });
    
    if (!vehiculo) {
      console.log('📝 Vehículo no existe, creándolo...');
      
      // ✅ CREAR VEHÍCULO NUEVO
      vehiculo = new Vehiculo({
        patente: ingreso.patente.toUpperCase(),
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
        physicalCardId: card._id,
        physicalCardNumber: card.cardNumber,
        qrCode: card.qrCode
      });
      
      await vehiculo.save();
      console.log('✅ Vehículo creado:', vehiculo._id);
      
    } else {
      console.log('✅ Vehículo ya existe, actualizando...');
      
      // ✅ ACTUALIZAR VEHÍCULO EXISTENTE
      vehiculo.physicalCardId = card._id;
      vehiculo.physicalCardNumber = card.cardNumber;
      vehiculo.qrCode = card.qrCode;
      await vehiculo.save();
      
      console.log('✅ Vehículo actualizado:', vehiculo._id);
    }
    
    // ════════════════════════════════════════════════════
    // PASO 5: ACTUALIZAR INGRESO
    // ════════════════════════════════════════════════════
    ingreso.physicalCardId = card._id;
    ingreso.physicalCardNumber = card.cardNumber;
    ingreso.physicalCardQR = card.qrCode;
    ingreso.hasPhysicalCard = true;
    await ingreso.save();
    
    console.log('✅ Ingreso actualizado con tarjeta');
    
    // ════════════════════════════════════════════════════
    // PASO 6: RESPONDER
    // ════════════════════════════════════════════════════
    return res.status(200).json({
      success: true,
      assignedCard: card,
      message: `Tarjeta ${card.cardNumber} asignada exitosamente`
    });
    
  } catch (error) {
    console.error('❌ Error en assignToVehicle:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al asignar tarjeta'
    });
  }
};
```

---

## 📊 Lo Que Está Pasando

### Request del Frontend:
```javascript
POST /api/physical-cards/assign-to-vehicle
{
  "establishmentId": "666236d2b6316ac455e22509",
  "establishmentName": "Malloys",
  "vehicleId": "68e7c123abc...",  // ← Este es el ingresoId
  "patente": "ABC123"
}
```

### En el Backend (INCORRECTO):
```javascript
// ❌ Si hace esto:
const vehiculo = await Vehiculo.findOne({ patente });
if (!vehiculo) {
  throw new Error('Vehículo no encontrado');  ← ERROR AQUÍ
}
```

### En el Backend (CORRECTO):
```javascript
// ✅ Debe hacer esto:
const vehiculo = await Vehiculo.findOne({ patente });
if (!vehiculo) {
  // CREAR el vehículo en lugar de fallar
  vehiculo = new Vehiculo({ 
    patente,
    // ... datos del ingreso
  });
  await vehiculo.save();
}
```

---

## 🎯 Solución

El backend debe **CREAR el vehículo si no existe**, no lanzar error.

### Código del Backend que Necesita Cambiar:

**Línea problemática (aproximadamente línea 210-220 del controller):**

```javascript
// ❌ ANTES (causa el error)
const vehiculo = await Vehiculo.findOne({ patente: patente.toUpperCase() });

if (!vehiculo) {
  return res.status(404).json({
    success: false,
    message: 'Vehículo no encontrado'  // ← Este es el error que ves
  });
}
```

**Cambiar a:**

```javascript
// ✅ DESPUÉS (correcto)
let vehiculo = await Vehiculo.findOne({ patente: patente.toUpperCase() });

if (!vehiculo) {
  console.log('📝 Vehículo no existe, creándolo...');
  
  const ingreso = await IngresoVehiculo.findById(vehicleId);
  
  vehiculo = new Vehiculo({
    patente: ingreso.patente.toUpperCase(),
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
  console.log('✅ Vehículo creado:', vehiculo._id);
}
```

---

## 📝 Logs para Debugging

### En el Frontend (ver en consola):

```
🚗 Paso 1: Creando vehículo/ingreso...
✅ Ingreso creado: { _id: "68e7c123abc...", patente: "ABC123" }
🏷️ Paso 2: Vinculando tarjeta al vehículo...
🏷️ Tarjeta: CM101
🏷️ Vehículo ID: 68e7c123abc...
```

Si ves el error después de esto, el problema está en el backend.

### En el Backend (agregar estos logs):

```javascript
console.log('📥 assignToVehicle - Request:', req.body);
console.log('🔍 Buscando ingreso:', vehicleId);

const ingreso = await IngresoVehiculo.findById(vehicleId);
console.log('📋 Ingreso encontrado:', ingreso ? 'SÍ' : 'NO');

if (ingreso) {
  console.log('📋 Patente del ingreso:', ingreso.patente);
}

console.log('🔍 Buscando vehículo:', patente);

const vehiculo = await Vehiculo.findOne({ patente: patente.toUpperCase() });
console.log('🚗 Vehículo encontrado:', vehiculo ? 'SÍ' : 'NO');

if (!vehiculo) {
  console.log('📝 CREANDO vehículo nuevo...');
  // Crear aquí, no lanzar error
}
```

---

## 🧪 Test Manual

Para verificar el problema, ejecuta en la consola del backend (o en MongoDB):

```javascript
// 1. Ver el último ingreso creado
use CARMAN
db.ingresosvehiculos.findOne({}, { patente: 1, _id: 1 }).sort({ _id: -1 })

// Resultado ejemplo:
// { "_id": "68e7c123abc...", "patente": "ABC123" }

// 2. Buscar si existe el vehículo con esa patente
db.vehiculos.findOne({ patente: "ABC123" })

// Si retorna null → el vehículo NO existe
// Entonces el backend DEBE crearlo, no dar error
```

---

## ✅ Solución Inmediata

**Compartir con el equipo de backend:**

En el archivo del controller `assignToVehicle`, cambiar:

```javascript
// ❌ Esto:
if (!vehiculo) {
  throw new Error('Vehículo no encontrado');
}

// ✅ Por esto:
if (!vehiculo) {
  const ingreso = await IngresoVehiculo.findById(vehicleId);
  vehiculo = new Vehiculo({
    patente: ingreso.patente.toUpperCase(),
    marca: ingreso.marca,
    modelo: ingreso.modelo,
    color: ingreso.color,
    // ... otros campos del ingreso
  });
  await vehiculo.save();
}
```

El código completo correcto está en:
- `NUEVO_FLUJO_TARJETAS_FISICAS.md` (líneas 210-243)
- `DIAGRAMA_FLUJO_TARJETAS.md` (sección "PASO 5")

---

## 🎯 Resumen

**Problema**: Backend lanza error si el vehículo no existe  
**Causa**: Backend no está creando el vehículo  
**Solución**: Backend debe crear el vehículo si no existe (código provisto arriba)  
**Documentos**: `NUEVO_FLUJO_TARJETAS_FISICAS.md` tiene el código completo  

El **frontend está correcto**, el cambio debe hacerse en el **backend**. ✅












