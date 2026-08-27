# 🚗 Proceso Completo de Ingreso de Vehículo - Guía Backend

**Fecha**: Octubre 2025  
**Versión**: 2.0  
**Para**: Equipo Backend  
**Base URL**: `https://carmanparking.com/api`

---

## 📋 Índice

1. [Flujo General](#-flujo-general)
2. [Paso 1: Asignación de Tarjeta Física](#-paso-1-asignación-de-tarjeta-física)
3. [Paso 2: Creación del Ingreso](#-paso-2-creación-del-ingreso)
4. [Paso 3: Liberación de Tarjetas](#-paso-3-liberación-de-tarjetas)
5. [Schema de MongoDB](#-schema-de-mongodb)
6. [Controllers Completos](#-controllers-completos)
7. [Casos de Uso](#-casos-de-uso)
8. [Testing](#-testing)
9. [Problemas Actuales](#-problemas-actuales)

---

## 🎯 Flujo General

```
┌─────────────────────────────────────────────────────────────────┐
│              PROCESO COMPLETO DE INGRESO DE VEHÍCULO             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  FRONTEND    │
│  (App Móvil) │
└──────┬───────┘
       │
       │ 1. Usuario abre "Nuevo Vehículo"
       │    Completa: patente, sector, llave, etc.
       │
       ▼
┌──────────────────────────────────────────────┐
│ ¿Tarjeta Física o QR Digital?               │
└──────┬────────────────────────┬──────────────┘
       │                        │
       │ [Asignar Tarjeta]      │ [No lleva tarjeta]
       │                        │
       ▼                        │
┌──────────────────┐            │
│  BACKEND API     │            │
│  POST /api/      │            │
│  physical-cards/ │            │
│  assign-next     │            │
└──────┬───────────┘            │
       │                        │
       │ Responde:              │
       │ {                      │
       │   cardNumber: "CM101", │
       │   qrCode: "...",       │
       │   _id: "..."           │
       │ }                      │
       │                        │
       ├────────────────────────┘
       │
       │ 2. Frontend envía todo a crear ingreso
       │
       ▼
┌──────────────────┐
│  BACKEND API     │
│  POST /api/      │
│  vehiculos/      │
│  ingresos        │
└──────┬───────────┘
       │
       │ 3. Backend GUARDA el ingreso con:
       │    - Datos del vehículo
       │    - physicalCardNumber (si tiene)
       │    - qrCode (si tiene)
       │    - noPhysicalCard (true/false)
       │
       │ 4. Backend ACTUALIZA la tarjeta:
       │    PhysicalCard.assignedVehicleId = ingresoId
       │
       ▼
┌──────────────────┐
│  Responde JSON   │
│  con TODOS los   │
│  campos incluidos│ ← IMPORTANTE
└──────┬───────────┘
       │
       │ 5. Frontend muestra:
       │    - Modal de éxito con QR
       │    - Badge en home
       │    - Botón en detalles
       │
       ▼
┌──────────────────┐
│  VEHÍCULO        │
│  INGRESADO ✓     │
└──────────────────┘
```

---

## 🎫 Paso 1: Asignación de Tarjeta Física

### Endpoint
```
POST /api/physical-cards/assign-next
```

### Request
```json
{
  "establishmentId": "666236d2b6316ac455e22509",
  "establishmentName": "Malloys"
}
```

### ⚠️ **PROBLEMA ACTUAL**

❌ El backend está **creando tarjetas nuevas** cada vez:
```
Primera llamada → Crea CM102
Segunda llamada → Crea CM103
Tercera llamada → Crea CM104
```

✅ **Debe REUTILIZAR tarjetas disponibles**:
```
Primera llamada → Asigna CM101 (disponible)
Segunda llamada → Asigna CM102 (disponible)
Se libera CM101 → Próxima llamada asigna CM101 (reutiliza)
```

### 🔧 **Implementación Correcta**

```javascript
// controllers/physicalCardController.js

exports.assignNextAvailableCard = async (req, res) => {
  try {
    const { establishmentId, establishmentName } = req.body;
    
    // Validaciones
    if (!establishmentId || !establishmentName) {
      return res.status(400).json({
        success: false,
        message: 'establishmentId y establishmentName son requeridos'
      });
    }
    
    console.log(`🏷️ Asignando tarjeta para: ${establishmentName} (${establishmentId})`);
    
    // ═══════════════════════════════════════════════════════════
    // PASO 1: BUSCAR TARJETAS DISPONIBLES (PRIORIDAD ALTA)
    // ═══════════════════════════════════════════════════════════
    const availableCards = await PhysicalCard.find({
      establishmentId: establishmentId,
      isActive: true,
      isAssigned: false  // Solo las NO asignadas
    }).sort({ cardNumber: 1 }); // Ordenar por número (menor primero)
    
    console.log(`📋 Tarjetas disponibles encontradas: ${availableCards.length}`);
    
    let assignedCard;
    
    // ═══════════════════════════════════════════════════════════
    // PASO 2: SI HAY DISPONIBLES, USAR LA DE MENOR NÚMERO
    // ═══════════════════════════════════════════════════════════
    if (availableCards.length > 0) {
      assignedCard = availableCards[0]; // La primera (menor número)
      assignedCard.isAssigned = true;
      assignedCard.assignedAt = new Date();
      assignedCard.updated_at = new Date();
      await assignedCard.save();
      
      console.log(`♻️ Reutilizando tarjeta disponible: ${assignedCard.cardNumber}`);
      
      return res.status(200).json({
        success: true,
        assignedCard,
        message: `Tarjeta ${assignedCard.cardNumber} asignada exitosamente`
      });
    }
    
    // ═══════════════════════════════════════════════════════════
    // PASO 3: SOLO SI NO HAY DISPONIBLES, CREAR UNA NUEVA
    // ═══════════════════════════════════════════════════════════
    
    console.log(`📝 No hay tarjetas disponibles. Creando una nueva...`);
    
    // Generar código del establecimiento (primera letra)
    const establishmentCode = establishmentName.charAt(0).toUpperCase();
    
    // Encontrar el número más alto existente para este establecimiento
    const lastCard = await PhysicalCard.findOne({ 
      establishmentId 
    }).sort({ cardNumber: -1 });
    
    // Calcular siguiente número (empezar en 101)
    let nextNumber = 101;
    if (lastCard) {
      // Extraer número de la tarjeta (ej: "CM105" → 105)
      const match = lastCard.cardNumber.match(/\d+$/);
      if (match) {
        const currentNumber = parseInt(match[0]);
        nextNumber = currentNumber + 1;
      }
    }
    
    // Generar número de tarjeta: C + Código Establecimiento + Número
    // Ejemplo: C (Carman) + M (Malloys) + 101 = CM101
    const cardNumber = `C${establishmentCode}${nextNumber}`;
    
    // Generar QR único: CardNumber + Timestamp + Random
    const qrCode = `${cardNumber}${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear nueva tarjeta
    assignedCard = new PhysicalCard({
      cardNumber,
      qrCode,
      isActive: true,
      isAssigned: true,  // Ya viene asignada
      assignedVehicleId: null, // Se asignará cuando se cree el vehículo
      assignedAt: new Date(),
      establishmentId,
      establishmentCode,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    await assignedCard.save();
    console.log(`✨ Nueva tarjeta creada y asignada: ${assignedCard.cardNumber}`);
    
    return res.status(200).json({
      success: true,
      assignedCard,
      message: `Tarjeta ${assignedCard.cardNumber} asignada exitosamente`
    });
    
  } catch (error) {
    console.error('❌ Error al asignar tarjeta:', error);
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
    "assignedVehicleId": null,
    "assignedAt": "2025-10-09T10:30:00.000Z",
    "establishmentId": "666236d2b6316ac455e22509",
    "establishmentCode": "M",
    "created_at": "2025-10-09T10:30:06.514Z",
    "updated_at": "2025-10-09T10:30:06.514Z"
  },
  "message": "Tarjeta CM101 asignada exitosamente"
}
```

---

## 📝 Paso 2: Creación del Ingreso

### Endpoint
```
POST /api/vehiculos/ingresos
```

### Request Body Completo - CON Tarjeta

```json
{
  "patente": "AG087IF",
  "sector": "A1",
  "nroLlave": 101,
  "establecimiento": "666236d2b6316ac455e22509",
  "horaIngreso": "10:30",
  
  "marca": "67890abcdef123456789",
  "modelo": "Corolla",
  "color": "Blanco",
  
  "nombreConductor": "Juan Pérez",
  "telefono": "+5491123456789",
  "quienSeLleva": "Mismo conductor",
  
  "vip": false,
  "recurrente": false,
  "inhabilitado": false,
  
  "turno": "68e12345678901234567890a",
  
  // ═══════════════════════════════════════════════════════════
  // CAMPOS DE TARJETA FÍSICA (enviados por el frontend)
  // ═══════════════════════════════════════════════════════════
  "physicalCardId": "68e59bee0693b68e94404e7c",
  "physicalCardNumber": "CM101",
  "qrCode": "CM1011759878126511",
  "noPhysicalCard": false
}
```

### Request Body - SIN Tarjeta (QR Digital)

```json
{
  "patente": "BC123CD",
  "sector": "A2",
  "nroLlave": 102,
  "establecimiento": "666236d2b6316ac455e22509",
  "horaIngreso": "11:00",
  
  // ... otros campos ...
  
  // ═══════════════════════════════════════════════════════════
  // SOLO ESTE CAMPO
  // ═══════════════════════════════════════════════════════════
  "noPhysicalCard": true
}
```

### 🔧 **Controller - Crear Ingreso**

```javascript
// controllers/ingresoController.js o vehiculoController.js

exports.crearIngreso = async (req, res) => {
  try {
    const {
      // Campos obligatorios
      patente,
      sector,
      establecimiento,
      
      // Campos opcionales básicos
      nroLlave,
      horaIngreso,
      marca,
      modelo,
      color,
      nombreConductor,
      telefono,
      quienSeLleva,
      vip,
      recurrente,
      inhabilitado,
      turno,
      
      // ═══════════════════════════════════════════════════════════
      // NUEVOS CAMPOS DE TARJETA FÍSICA (IMPORTANTE)
      // ═══════════════════════════════════════════════════════════
      physicalCardId,
      physicalCardNumber,
      qrCode,
      noPhysicalCard,
    } = req.body;
    
    // Validaciones básicas
    if (!patente || !sector || !establecimiento) {
      return res.status(400).json({
        success: false,
        message: 'Patente, sector y establecimiento son obligatorios'
      });
    }
    
    console.log('📝 Creando ingreso:', {
      patente,
      sector,
      physicalCardNumber: physicalCardNumber || 'Sin tarjeta',
      noPhysicalCard
    });
    
    // Crear el documento de ingreso
    const nuevoIngreso = new Ingreso({
      patente: patente.toUpperCase(),
      sector,
      nroLlave: nroLlave || null,
      establecimiento,
      horaIngreso: horaIngreso || new Date().toLocaleTimeString('es-AR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      estado: 'INGRESADO',
      marca: marca || null,
      modelo: modelo || null,
      color: color || null,
      nombreConductor: nombreConductor || null,
      telefono: telefono || null,
      quienSeLleva: quienSeLleva || null,
      vip: vip || false,
      recurrente: recurrente || false,
      inhabilitado: inhabilitado || false,
      turno: turno || null,
      
      // ═══════════════════════════════════════════════════════════
      // INCLUIR CAMPOS DE TARJETA FÍSICA
      // ESTOS CAMPOS DEBEN GUARDARSE Y DEVOLVERSE
      // ═══════════════════════════════════════════════════════════
      physicalCardId: physicalCardId || null,
      physicalCardNumber: physicalCardNumber || null,
      qrCode: qrCode || null,
      noPhysicalCard: noPhysicalCard || false,
      
      // Historial de estados
      historialEstados: [{
        estado: 'INGRESADO',
        fecha: new Date(),
        empleado: req.user?._id || req.user?.id,
        observacion: 'Ingreso inicial'
      }]
    });
    
    // Guardar en base de datos
    await nuevoIngreso.save();
    
    console.log('✅ Ingreso creado con ID:', nuevoIngreso._id);
    
    // ═══════════════════════════════════════════════════════════
    // SI HAY TARJETA FÍSICA, ACTUALIZAR EL assignedVehicleId
    // ═══════════════════════════════════════════════════════════
    if (physicalCardId) {
      console.log(`🔗 Vinculando tarjeta ${physicalCardNumber} con vehículo ${nuevoIngreso._id}`);
      
      await PhysicalCard.findByIdAndUpdate(physicalCardId, {
        assignedVehicleId: nuevoIngreso._id,
        updated_at: new Date()
      });
    }
    
    // Poblar referencias para la respuesta
    await nuevoIngreso.populate([
      { path: 'marca' },
      { path: 'establecimiento' },
      { path: 'turno' }
    ]);
    
    // ═══════════════════════════════════════════════════════════
    // RESPONDER CON EL INGRESO COMPLETO
    // DEBE INCLUIR physicalCardNumber, qrCode, etc.
    // ═══════════════════════════════════════════════════════════
    console.log('📨 Respondiendo con ingreso:', {
      _id: nuevoIngreso._id,
      patente: nuevoIngreso.patente,
      physicalCardNumber: nuevoIngreso.physicalCardNumber
    });
    
    return res.status(201).json(nuevoIngreso);
    
  } catch (error) {
    console.error('❌ Error creando ingreso:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear ingreso',
      error: error.message
    });
  }
};
```

### Response Esperado

```json
{
  "_id": "68e7c1234567890abcdef123",
  "patente": "AG087IF",
  "sector": "A1",
  "nroLlave": 101,
  "establecimiento": {
    "_id": "666236d2b6316ac455e22509",
    "nombre": "Malloys"
  },
  "horaIngreso": "10:30",
  "estado": "INGRESADO",
  "marca": {
    "_id": "...",
    "descripcion": "Toyota"
  },
  "modelo": "Corolla",
  "color": "Blanco",
  "nombreConductor": "Juan Pérez",
  "telefono": "+5491123456789",
  "quienSeLleva": "Mismo conductor",
  "vip": false,
  "recurrente": false,
  "inhabilitado": false,
  
  "physicalCardId": "68e59bee0693b68e94404e7c",
  "physicalCardNumber": "CM101",          // ← DEBE ESTAR
  "qrCode": "CM1011759878126511",        // ← DEBE ESTAR
  "noPhysicalCard": false,                // ← DEBE ESTAR
  
  "turno": "...",
  "historialEstados": [
    {
      "estado": "INGRESADO",
      "fecha": "2025-10-09T10:30:00.000Z",
      "empleado": "...",
      "_id": "..."
    }
  ],
  "created_at": "2025-10-09T10:30:00.000Z",
  "updated_at": "2025-10-09T10:30:00.000Z",
  "__v": 0
}
```

---

## 🔄 Paso 3: Liberación de Tarjetas

### Cuándo Liberar

La tarjeta debe liberarse cuando el vehículo se **ENTREGA**:

```
Estado: INGRESADO → SOLICITADO → EN CAMINO → ENTREGADO
                                                  ↑
                                        LIBERAR TARJETA AQUÍ
```

### Endpoint
```
POST /api/vehiculos/ingresos/estado
```

### Request
```json
{
  "ingresoId": "68e7c1234567890abcdef123",
  "estado": "ENTREGADO"
}
```

### 🔧 **Controller - Cambiar Estado**

```javascript
// controllers/ingresoController.js

exports.cambiarEstado = async (req, res) => {
  try {
    const { ingresoId, estado } = req.body;
    
    // Validaciones
    const estadosValidos = ['INGRESADO', 'ESTACIONADO', 'SOLICITADO', 'EN CAMINO', 'ENTREGADO', 'FACTURADO'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }
    
    // Buscar el ingreso
    const ingreso = await Ingreso.findById(ingresoId);
    if (!ingreso) {
      return res.status(404).json({
        success: false,
        message: 'Ingreso no encontrado'
      });
    }
    
    console.log(`🔄 Cambiando estado de ${ingreso.patente}: ${ingreso.estado} → ${estado}`);
    
    // Actualizar estado
    ingreso.estado = estado;
    ingreso.historialEstados.push({
      estado,
      fecha: new Date(),
      empleado: req.user?._id || req.user?.id,
      observacion: `Cambio de estado a ${estado}`
    });
    
    await ingreso.save();
    
    // ═══════════════════════════════════════════════════════════
    // SI EL ESTADO ES ENTREGADO Y TIENE TARJETA, LIBERARLA
    // ═══════════════════════════════════════════════════════════
    if (estado === 'ENTREGADO' && ingreso.physicalCardId) {
      console.log(`🏷️ Liberando tarjeta ${ingreso.physicalCardNumber} del vehículo ${ingreso.patente}`);
      
      await PhysicalCard.findByIdAndUpdate(ingreso.physicalCardId, {
        isAssigned: false,        // Marcar como disponible
        assignedVehicleId: null,  // Desvincular del vehículo
        updated_at: new Date()
      });
      
      console.log(`✅ Tarjeta ${ingreso.physicalCardNumber} liberada y disponible para reutilizar`);
    }
    
    return res.status(200).json({
      success: true,
      ingreso,
      message: `Estado cambiado a ${estado} exitosamente`
    });
    
  } catch (error) {
    console.error('❌ Error cambiando estado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar estado',
      error: error.message
    });
  }
};
```

---

## 🗄️ Schema de MongoDB

### Modelo: Ingreso

```javascript
// models/Ingreso.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EstadoSchema = new Schema({
  estado: { 
    type: String, 
    required: true,
    enum: ['INGRESADO', 'ESTACIONADO', 'SOLICITADO', 'EN CAMINO', 'ENTREGADO', 'FACTURADO']
  },
  fecha: { type: Date, required: true },
  empleado: { type: Schema.Types.ObjectId, ref: 'Usuario' },
  observacion: { type: String }
});

const IngresoSchema = new Schema({
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CAMPOS OBLIGATORIOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  patente: { 
    type: String, 
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  sector: { 
    type: String, 
    required: true 
  },
  establecimiento: { 
    type: Schema.Types.ObjectId, 
    ref: 'Establecimiento', 
    required: true,
    index: true
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CAMPOS OPCIONALES BÁSICOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  nroLlave: { 
    type: Number,
    default: null
  },
  horaIngreso: { 
    type: String,
    default: null
  },
  estado: { 
    type: String, 
    default: 'INGRESADO',
    enum: ['INGRESADO', 'ESTACIONADO', 'SOLICITADO', 'EN CAMINO', 'ENTREGADO', 'FACTURADO'],
    index: true
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INFORMACIÓN DEL VEHÍCULO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  marca: { 
    type: Schema.Types.ObjectId, 
    ref: 'Marca',
    default: null
  },
  modelo: { 
    type: String,
    default: null
  },
  color: { 
    type: String,
    default: null
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // INFORMACIÓN DEL CONDUCTOR
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  nombreConductor: { 
    type: String,
    default: null
  },
  telefono: { 
    type: String,
    default: null
  },
  quienSeLleva: { 
    type: String,
    default: null
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // BADGES Y CARACTERÍSTICAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  vip: { 
    type: Boolean, 
    default: false 
  },
  recurrente: { 
    type: Boolean, 
    default: false 
  },
  inhabilitado: { 
    type: Boolean, 
    default: false 
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TURNO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  turno: { 
    type: Schema.Types.ObjectId, 
    ref: 'Turno',
    default: null,
    index: true
  },
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HISTORIAL DE ESTADOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  historialEstados: [EstadoSchema],
  
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ⭐ NUEVOS CAMPOS - TARJETA FÍSICA (AGREGAR ESTOS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  physicalCardId: {
    type: Schema.Types.ObjectId,
    ref: 'PhysicalCard',
    required: false,
    default: null
  },
  physicalCardNumber: {
    type: String,
    required: false,
    default: null,
    index: true  // Para búsquedas rápidas
  },
  qrCode: {
    type: String,
    required: false,
    default: null,
    unique: true,  // Cada QR debe ser único
    sparse: true,  // Permite múltiples null
    index: true
  },
  noPhysicalCard: {
    type: Boolean,
    default: false
  }
  
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Índices compuestos para mejorar performance
IngresoSchema.index({ establecimiento: 1, estado: 1, turno: 1 });
IngresoSchema.index({ patente: 1, establecimiento: 1 });
IngresoSchema.index({ created_at: -1 });

module.exports = mongoose.model('Ingreso', IngresoSchema);
```

### Modelo: PhysicalCard

```javascript
// models/PhysicalCard.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PhysicalCardSchema = new Schema({
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
    default: true,
    index: true
  },
  isAssigned: {
    type: Boolean,
    default: false,
    index: true  // Para búsquedas de disponibles
  },
  assignedVehicleId: {
    type: Schema.Types.ObjectId,
    ref: 'Ingreso',
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  establishmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Establecimiento',
    required: true,
    index: true
  },
  establishmentCode: {
    type: String,
    required: true
  }
}, {
  timestamps: { 
    createdAt: 'created_at', 
    updatedAt: 'updated_at' 
  }
});

// Índice compuesto para búsquedas de disponibles por establecimiento
PhysicalCardSchema.index({ establishmentId: 1, isAssigned: 1, isActive: 1 });

module.exports = mongoose.model('PhysicalCard', PhysicalCardSchema);
```

---

## 💼 Casos de Uso Completos

### Caso 1: Ingreso Simple con Tarjeta

```javascript
// ════════════════════════════════════════════════════════════
// FLUJO COMPLETO - CON TARJETA FÍSICA
// ════════════════════════════════════════════════════════════

// 1. Frontend solicita tarjeta
POST /api/physical-cards/assign-next
{
  "establishmentId": "666236d2b6316ac455e22509",
  "establishmentName": "Malloys"
}

// 2. Backend busca disponibles
db.physicalcards.find({ 
  establishmentId: "666236d2b6316ac455e22509",
  isActive: true,
  isAssigned: false 
}).sort({ cardNumber: 1 })

// Resultado: [CM101] ← Asignar esta

// 3. Backend actualiza la tarjeta
db.physicalcards.updateOne(
  { _id: "..." },
  { 
    $set: { 
      isAssigned: true,
      assignedAt: new Date(),
      updated_at: new Date()
    }
  }
)

// 4. Backend responde
{
  "success": true,
  "assignedCard": {
    "cardNumber": "CM101",
    "qrCode": "CM1011759878126511",
    "_id": "68e59bee0693b68e94404e7c"
  }
}

// 5. Frontend crea el ingreso
POST /api/vehiculos/ingresos
{
  "patente": "AG087IF",
  "sector": "A1",
  "physicalCardId": "68e59bee0693b68e94404e7c",
  "physicalCardNumber": "CM101",
  "qrCode": "CM1011759878126511"
}

// 6. Backend guarda el ingreso
db.ingresos.insertOne({
  patente: "AG087IF",
  sector: "A1",
  physicalCardId: ObjectId("68e59bee0693b68e94404e7c"),
  physicalCardNumber: "CM101",      // ← GUARDAR
  qrCode: "CM1011759878126511",    // ← GUARDAR
  noPhysicalCard: false,
  estado: "INGRESADO",
  // ...
})

// 7. Backend vincula tarjeta con vehículo
db.physicalcards.updateOne(
  { _id: ObjectId("68e59bee0693b68e94404e7c") },
  { 
    $set: { 
      assignedVehicleId: ObjectId("68e7c1234567890abcdef123")
    }
  }
)

// 8. Backend responde con TODO incluido
{
  "_id": "68e7c1234567890abcdef123",
  "patente": "AG087IF",
  "physicalCardNumber": "CM101",   // ← DEBE ESTAR EN RESPONSE
  "qrCode": "CM1011759878126511",  // ← DEBE ESTAR EN RESPONSE
  // ...
}

// 9. Frontend lista vehículos
GET /api/vehiculos/ingresos?establecimiento=666236d2b6316ac455e22509

// Backend debe devolver:
[
  {
    "_id": "68e7c1234567890abcdef123",
    "patente": "AG087IF",
    "physicalCardNumber": "CM101",  // ← DEBE ESTAR
    "estado": "INGRESADO"
  }
]

// 10. Frontend muestra badge azul 🔵 en tarjeta del vehículo
```

### Caso 2: Entregar Vehículo

```javascript
// ════════════════════════════════════════════════════════════
// FLUJO DE ENTREGA - LIBERAR TARJETA
// ════════════════════════════════════════════════════════════

// 1. Frontend cambia estado a ENTREGADO
POST /api/vehiculos/ingresos/estado
{
  "ingresoId": "68e7c1234567890abcdef123",
  "estado": "ENTREGADO"
}

// 2. Backend busca el ingreso
const ingreso = await Ingreso.findById("68e7c1234567890abcdef123");
// {
//   patente: "AG087IF",
//   physicalCardId: "68e59bee0693b68e94404e7c",
//   physicalCardNumber: "CM101"
// }

// 3. Backend detecta que tiene tarjeta física
if (ingreso.physicalCardId) {
  // Liberar la tarjeta
  await PhysicalCard.findByIdAndUpdate(
    ingreso.physicalCardId,
    {
      isAssigned: false,
      assignedVehicleId: null
    }
  );
}

// 4. Ahora la tarjeta CM101 está disponible
db.physicalcards.findOne({ cardNumber: "CM101" })
// {
//   cardNumber: "CM101",
//   isAssigned: false,        ← Disponible
//   assignedVehicleId: null
// }

// 5. Próximo vehículo podrá usar CM101 nuevamente ♻️
```

### Caso 3: Priorización de Tarjetas

```javascript
// ════════════════════════════════════════════════════════════
// EJEMPLO DE PRIORIZACIÓN
// ════════════════════════════════════════════════════════════

// Estado inicial de tarjetas:
db.physicalcards.find({}, { cardNumber: 1, isAssigned: 1 })

[
  { cardNumber: "CM100", isAssigned: false },  // Disponible
  { cardNumber: "CM101", isAssigned: true },   // Ocupada
  { cardNumber: "CM102", isAssigned: false },  // Disponible
  { cardNumber: "CM103", isAssigned: true },   // Ocupada
  { cardNumber: "CM104", isAssigned: false }   // Disponible
]

// Solicitud 1: Asignar tarjeta
→ Busca disponibles ordenadas: [CM100, CM102, CM104]
→ Asigna CM100 (la de menor número)

// Solicitud 2: Asignar tarjeta
→ Busca disponibles ordenadas: [CM102, CM104]
→ Asigna CM102

// Se entrega vehículo con CM100 → Tarjeta liberada
db.physicalcards.updateOne(
  { cardNumber: "CM100" },
  { $set: { isAssigned: false } }
)

// Solicitud 3: Asignar tarjeta
→ Busca disponibles ordenadas: [CM100, CM104]
→ Asigna CM100 (prioriza la de menor número) ♻️
```

---

## 🧪 Testing Completo

### Preparación

1. **Crear tarjetas de prueba en MongoDB:**

```javascript
use CARMAN

// Eliminar tarjetas existentes (opcional)
db.physicalcards.deleteMany({ establishmentId: ObjectId("666236d2b6316ac455e22509") })

// Crear 10 tarjetas disponibles
const cards = [];
for (let i = 101; i <= 110; i++) {
  cards.push({
    cardNumber: `CM${i}`,
    qrCode: `CM${i}${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
    isActive: true,
    isAssigned: false,
    assignedVehicleId: null,
    establishmentId: ObjectId("666236d2b6316ac455e22509"),
    establishmentCode: "M",
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

db.physicalcards.insertMany(cards);

// Verificar
db.physicalcards.find({ isAssigned: false }).count()
// Debe mostrar: 10
```

### Test 1: Asignar Primera Tarjeta

```bash
curl -X POST https://carmanparking.com/api/physical-cards/assign-next \
  -H "Content-Type: application/json" \
  -d '{
    "establishmentId":"666236d2b6316ac455e22509",
    "establishmentName":"Malloys"
  }'
```

**Esperado**:
```json
{
  "success": true,
  "assignedCard": {
    "cardNumber": "CM101"  // ← Debe ser CM101 (la de menor número)
  }
}
```

**Verificar en MongoDB:**
```javascript
db.physicalcards.findOne({ cardNumber: "CM101" })
// isAssigned debe ser true
```

### Test 2: Crear Ingreso con Tarjeta

```bash
# Usar el TOKEN de un usuario autenticado
export TOKEN="tu_token_aqui"

curl -X POST https://carmanparking.com/api/vehiculos/ingresos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "patente": "TEST001",
    "sector": "A1",
    "nroLlave": 101,
    "establecimiento": "666236d2b6316ac455e22509",
    "physicalCardId": "USAR_ID_DE_TEST1",
    "physicalCardNumber": "CM101",
    "qrCode": "USAR_QR_DE_TEST1",
    "noPhysicalCard": false
  }'
```

**Esperado**:
- Status: 201 Created
- Response debe incluir: `physicalCardNumber`, `qrCode`

**Verificar en MongoDB:**
```javascript
db.ingresos.findOne({ patente: "TEST001" })
// Debe tener: physicalCardNumber: "CM101"
```

### Test 3: Listar Ingresos

```bash
curl https://carmanparking.com/api/vehiculos/ingresos?establecimiento=666236d2b6316ac455e22509 \
  -H "Authorization: Bearer $TOKEN"
```

**Verificar**: Cada ingreso con tarjeta debe tener `physicalCardNumber` visible en la response.

### Test 4: Cambiar Estado a ENTREGADO

```bash
curl -X POST https://carmanparking.com/api/vehiculos/ingresos/estado \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "ingresoId": "ID_DEL_INGRESO_TEST001",
    "estado": "ENTREGADO"
  }'
```

**Verificar en MongoDB:**
```javascript
// La tarjeta debe estar liberada
db.physicalcards.findOne({ cardNumber: "CM101" })
// isAssigned: false
// assignedVehicleId: null
```

### Test 5: Segunda Asignación (Reutilización)

```bash
curl -X POST https://carmanparking.com/api/physical-cards/assign-next \
  -H "Content-Type: application/json" \
  -d '{
    "establishmentId":"666236d2b6316ac455e22509",
    "establishmentName":"Malloys"
  }'
```

**Esperado**:
```json
{
  "assignedCard": {
    "cardNumber": "CM101"  // ← Debe reutilizar CM101
  }
}
```

---

## 🚨 Problemas Actuales y Soluciones

### ❌ Problema 1: "Se crean tarjetas nuevas en lugar de reutilizar"

**Síntoma**: 
- Cada llamada a `assign-next` crea CM102, CM103, CM104...
- Tarjetas CM101-CM110 siguen con `isAssigned: false`

**Causa**: 
El controller no está buscando disponibles primero.

**Solución**:
Implementar PASO 1 del controller `assignNextAvailableCard` (líneas 23-48 de este documento).

### ❌ Problema 2: "Los badges no aparecen en el home"

**Síntoma**: 
- Frontend muestra la lista de vehículos
- No aparecen badges azules ni grises

**Causa**: 
El backend no está devolviendo `physicalCardNumber` en la respuesta de `/api/vehiculos/ingresos`.

**Verificación**:
```bash
curl https://carmanparking.com/api/vehiculos/ingresos?establecimiento=666236d2b6316ac455e22509 \
  -H "Authorization: Bearer $TOKEN" | jq '.[0] | {patente, physicalCardNumber}'
```

Si muestra `"physicalCardNumber": null` o el campo no existe → Problema en backend.

**Solución**:
1. Agregar campos al Schema (líneas 226-254 de este documento)
2. Guardar campos en controller (líneas 95-102)
3. Asegurar que el response los incluye (líneas 152-157)

### ❌ Problema 3: "Las tarjetas no se liberan"

**Síntoma**: 
- Todas las tarjetas quedan `isAssigned: true`
- No hay tarjetas disponibles para reutilizar

**Causa**: 
No se está liberando la tarjeta cuando el estado cambia a "ENTREGADO".

**Solución**:
Implementar liberación en el controller de cambio de estado (líneas 105-120 de este documento).

### ❌ Problema 4: "assignedVehicleId no se actualiza"

**Síntoma**: 
- La tarjeta tiene `assignedVehicleId: null`
- No se puede rastrear qué vehículo tiene qué tarjeta

**Causa**: 
No se está actualizando la tarjeta después de crear el ingreso.

**Solución**:
Implementar actualización después del save (líneas 142-150 de este documento).

---

## 📊 Endpoints Completos - Resumen

| Endpoint | Método | Propósito | Estado Actual |
|----------|--------|-----------|---------------|
| `/api/physical-cards/assign-next` | POST | Asignar próxima tarjeta | ⚠️ Crea nuevas en vez de reutilizar |
| `/api/vehiculos/ingresos` | POST | Crear ingreso | ⚠️ No guarda campos de tarjeta |
| `/api/vehiculos/ingresos` | GET | Listar ingresos | ⚠️ No devuelve campos de tarjeta |
| `/api/vehiculos/{id}` | GET | Obtener ingreso | ⚠️ No devuelve campos de tarjeta |
| `/api/vehiculos/ingresos/estado` | POST | Cambiar estado | ⚠️ No libera tarjetas |
| `/api/physical-cards/{id}/release` | POST | Liberar tarjeta | ✅ Funciona |

---

## ✅ Checklist de Implementación

### Prioridad 1: Campos en Base de Datos
- [ ] Agregar `physicalCardId` a Schema de Ingreso
- [ ] Agregar `physicalCardNumber` a Schema de Ingreso
- [ ] Agregar `qrCode` a Schema de Ingreso
- [ ] Agregar `noPhysicalCard` a Schema de Ingreso
- [ ] Crear índices en `physicalCardNumber` y `qrCode`

### Prioridad 2: Controller de Creación
- [ ] Aceptar los 4 campos en `req.body`
- [ ] Guardar los campos en el documento
- [ ] Actualizar `PhysicalCard.assignedVehicleId`
- [ ] Devolver los campos en la respuesta
- [ ] Hacer populate de referencias

### Prioridad 3: Controller de Asignación
- [ ] Buscar tarjetas disponibles PRIMERO
- [ ] Ordenar por número (menor primero)
- [ ] Solo crear nueva si NO hay disponibles
- [ ] Marcar como asignada correctamente

### Prioridad 4: Controller de Estado
- [ ] Detectar estado "ENTREGADO"
- [ ] Liberar tarjeta física si existe
- [ ] Actualizar `isAssigned: false`

### Prioridad 5: Testing
- [ ] Crear tarjetas de prueba en MongoDB
- [ ] Probar asignación (debe dar CM101)
- [ ] Probar creación de ingreso
- [ ] Verificar que response incluye campos
- [ ] Probar liberación
- [ ] Verificar reutilización

---

## 🎯 Resultado Esperado

Una vez implementado correctamente:

```
✅ Tarjetas se reutilizan (prioridad a menor número)
✅ Los campos se guardan en el ingreso
✅ Los campos se devuelven en todas las responses
✅ Los badges aparecen en el home
✅ El botón de tarjeta aparece en detalles
✅ Las tarjetas se liberan al entregar
✅ El sistema funciona end-to-end
```

---

## 📞 Soporte

### Documentos de Referencia:
- Este documento: Proceso completo
- `PHYSICAL_CARDS_BACKEND_IMPLEMENTATION.md`: Código completo de controllers
- `TROUBLESHOOTING_PHYSICAL_CARDS.md`: Solución de problemas

### Scripts de Prueba:
```bash
# Probar endpoints de tarjetas
node test-physical-cards-api.js

# Probar creación de vehículo con tarjeta
node test-vehicle-with-card.js
```

### Contacto:
Si hay dudas sobre la implementación, revisar primero los documentos de referencia o ejecutar los scripts de prueba para diagnosticar el problema.

---

**¡Éxito en la implementación!** 🚀












