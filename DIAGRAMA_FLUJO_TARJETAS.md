# 📊 Diagrama de Flujo - Tarjetas Físicas

## 🎯 Flujo Completo: Frontend → Backend → Base de Datos

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PASO 1: CREAR INGRESO                        │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND                    BACKEND                         MONGODB
────────                    ───────                         ───────

Usuario completa 
formulario
   │
   ├─ Patente: ABC123
   ├─ Sector: A1
   ├─ Llave: 101
   └─ Toca "Asignar Tarjeta"
        │
        └─ assignedCard = { cardNumber: "CM101", ... }
           (guarda en estado local)
        
Usuario toca 
"Agregar Vehículo"
        │
        ▼
   POST /api/vehiculos/
   ingresos
   {
     patente: "ABC123",
     sector: "A1",
     nroLlave: 101,
     ...
   }
                            ────────────────────►
                            
                            1. Buscar vehículo          ────────────────────►
                               Vehiculo.findOne(
                                 { patente: "ABC123" }
                               )
                                                        ◄────────────────────
                                                        ¿Existe?
                            
                            2a. NO existe:
                                vehiculo = new Vehiculo({
                                  patente: "ABC123",
                                  marca: ...,
                                  modelo: ...,
                                })
                                await vehiculo.save()
                                                        ────────────────────►
                                                        Guarda en 'vehiculos'
                                                        _id: "veh789"
                            
                            2b. SÍ existe:
                                vehiculo = (el encontrado)
                                                        vehiculos: {
                                                          _id: "veh789",
                                                          patente: "ABC123"
                                                        }
                            
                            3. Crear ingreso:
                               ingreso = new IngresoVehiculo({
                                 patente: "ABC123",
                                 vehiculo: "veh789",
                                 sector: "A1",
                                 nroLlave: 101,
                                 estado: "INGRESADO",
                                 ...
                               })
                               await ingreso.save()
                                                        ────────────────────►
                                                        Guarda en 'ingresosvehiculos'
                                                        _id: "ing123"
                            
                            4. Responder:
   ◄────────────────────    return ingreso
   
   Recibe:
   {
     _id: "ing123",      ← ID del INGRESO
     patente: "ABC123",
     sector: "A1",
     ...
   }
        │
        └─ result._id = "ing123"


┌─────────────────────────────────────────────────────────────────────┐
│                    PASO 2: VINCULAR TARJETA                          │
└─────────────────────────────────────────────────────────────────────┘

FRONTEND                    BACKEND                         MONGODB
────────                    ───────                         ───────

¿Hay tarjeta asignada?
   SÍ → Continuar
        │
        ▼
   POST /api/physical-cards/
   assign-to-vehicle
   {
     establishmentId: "...",
     establishmentName: "Malloys",
     vehicleId: "ing123",  ← ID del INGRESO
     patente: "ABC123"
   }
                            ────────────────────►
                            
                            1. Buscar ingreso           ────────────────────►
                               ingreso = 
                               IngresoVehiculo.findById(
                                 "ing123"
                               )
                                                        ◄────────────────────
                                                        {
                                                          _id: "ing123",
                                                          patente: "ABC123",
                                                          vehiculo: "veh789"
                                                        }
                            
                            2. Buscar tarjeta disponible ────────────────────►
                               PhysicalCard.find({
                                 isAssigned: false
                               }).sort({ cardNumber: 1 })
                                                        ◄────────────────────
                                                        [CM101, CM102, ...]
                            
                            3. Asignar tarjeta:
                               card = cards[0]  // CM101
                               card.isAssigned = true
                               card.assignedVehicleId = "ing123"
                               await card.save()
                                                        ────────────────────►
                                                        Actualiza 'physicalcards':
                                                        {
                                                          cardNumber: "CM101",
                                                          isAssigned: true,
                                                          assignedVehicleId: "ing123"
                                                        }
                            
                            4. Buscar vehículo por patente ──────────────────►
                               vehiculo = Vehiculo.findOne({
                                 patente: "ABC123"
                               })
                                                        ◄────────────────────
                                                        {
                                                          _id: "veh789",
                                                          patente: "ABC123"
                                                        }
                            
                            5a. Si vehículo NO existe:
                                vehiculo = new Vehiculo({
                                  patente: ingreso.patente,
                                  physicalCardNumber: "CM101",
                                  ...
                                })
                                await vehiculo.save()
                                                        ────────────────────►
                                                        Crea en 'vehiculos'
                            
                            5b. Si vehículo SÍ existe:
                                vehiculo.physicalCardNumber = "CM101"
                                vehiculo.qrCode = "CM1011759..."
                                await vehiculo.save()
                                                        ────────────────────►
                                                        Actualiza 'vehiculos':
                                                        {
                                                          _id: "veh789",
                                                          physicalCardNumber: "CM101",
                                                          qrCode: "CM1011759..."
                                                        }
                            
                            6. Actualizar ingreso:
                               ingreso.physicalCardNumber = "CM101"
                               ingreso.qrCode = "CM1011759..."
                               await ingreso.save()
                                                        ────────────────────►
                                                        Actualiza 'ingresosvehiculos':
                                                        {
                                                          _id: "ing123",
                                                          physicalCardNumber: "CM101",
                                                          qrCode: "CM1011759..."
                                                        }
                            
                            7. Responder:
   ◄────────────────────    return { assignedCard }
   
   Recibe:
   {
     success: true,
     assignedCard: {
       cardNumber: "CM101",
       qrCode: "CM1011759...",
       assignedVehicleId: "ing123"
     }
   }
        │
        ▼
   Actualiza objeto local:
   result.physicalCardNumber = "CM101"
   result.qrCode = "CM1011759..."
        │
        ▼
   Muestra modal de éxito
   con QR y número de tarjeta


┌─────────────────────────────────────────────────────────────────────┐
│                   RESULTADO EN BASE DE DATOS                         │
└─────────────────────────────────────────────────────────────────────┘

Colección: physicalcards
{
  "_id": "card101",
  "cardNumber": "CM101",
  "qrCode": "CM1011759878126511",
  "isAssigned": true,
  "assignedVehicleId": "ing123"  ← Vinculado al INGRESO
}

Colección: vehiculos
{
  "_id": "veh789",
  "patente": "ABC123",
  "marca": "Toyota",
  "modelo": "Corolla",
  "physicalCardNumber": "CM101",  ← Info de tarjeta
  "qrCode": "CM1011759878126511"
}

Colección: ingresosvehiculos
{
  "_id": "ing123",
  "patente": "ABC123",
  "vehiculo": "veh789",
  "sector": "A1",
  "nroLlave": 101,
  "estado": "INGRESADO",
  "physicalCardNumber": "CM101",  ← Info de tarjeta
  "physicalCardQR": "CM1011759878126511",
  "physicalCardId": "card101"
}

┌─────────────────────────────────────────────────────────────────────┐
│              VINCULACIÓN COMPLETA BIDIRECCIONAL                      │
└─────────────────────────────────────────────────────────────────────┘

PhysicalCard.assignedVehicleId  →  IngresoVehiculo._id
IngresoVehiculo.physicalCardId  →  PhysicalCard._id
IngresoVehiculo.vehiculo        →  Vehiculo._id
Vehiculo.physicalCardNumber     =  PhysicalCard.cardNumber

```

---

## ⚠️ Puntos Críticos

### 1. El `vehicleId` es realmente el `ingresoId`

Cuando el frontend envía:
```json
{
  "vehicleId": "68e7c1234567890abcdef123"
}
```

Este ID es del **INGRESO**, NO del vehículo master.

### 2. El Backend Debe:

```javascript
// ✅ CORRECTO
const ingreso = await IngresoVehiculo.findById(vehicleId);
const vehiculo = await Vehiculo.findOne({ patente: ingreso.patente });

if (!vehiculo) {
  // Crear el vehículo si no existe
  vehiculo = new Vehiculo({ patente: ingreso.patente, ... });
  await vehiculo.save();
}
```

```javascript
// ❌ INCORRECTO
const vehiculo = await Vehiculo.findById(vehicleId);
// Esto falla porque vehicleId no es un ID de vehículo
```

### 3. Orden de Operaciones

```
1. Buscar ingreso por vehicleId (ingresoId) ✅
2. Obtener patente del ingreso ✅
3. Buscar vehículo por patente ✅
4. Si no existe, crear vehículo ✅
5. Vincular tarjeta a vehículo e ingreso ✅
```

---

## 🎯 Resumen

**El flujo correcto es:**
1. Frontend crea ingreso → obtiene `ingresoId`
2. Frontend envía `ingresoId` como `vehicleId` al endpoint de tarjetas
3. Backend busca el ingreso por `ingresoId`
4. Backend obtiene la patente del ingreso
5. Backend busca o crea el vehículo con esa patente
6. Backend vincula la tarjeta tanto al ingreso como al vehículo
7. Frontend recibe la tarjeta vinculada y actualiza la UI

**¡Todo queda correctamente vinculado!** ✅












