# 🔍 Troubleshooting - Tarjetas Físicas No Se Ven

## 🚨 Problema

Las tarjetas físicas asignadas no aparecen en el home ni en los detalles del vehículo.

## ✅ Verificación Frontend

El frontend **SÍ está enviando** los datos correctamente:

### Código en VehicleForm.tsx (líneas 168-177):
```typescript
const input: VehicleDataWithTime = { 
  ...data, 
  horaIngreso: new Date().toLocaleTimeString('es-AR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  }),
  // Incluir información de tarjeta física si está asignada
  ...(assignedCard && {
    physicalCardId: assignedCard._id,
    physicalCardNumber: assignedCard.cardNumber,
    qrCode: assignedCard.qrCode,
    noPhysicalCard: false,
  }),
  // Si no lleva tarjeta física
  ...(noPhysicalCard && {
    noPhysicalCard: true,
  })
};
```

## 🔍 Verificación en Consola

### 1. Abrir las DevTools de React Native

En la terminal donde corre Expo, presiona `j` para abrir el debugger.

### 2. Buscar en los logs:

Cuando agregas un vehículo, deberías ver:
```
🚗 Input data: {
  "patente": "ABC123",
  "sector": "A1",
  "nroLlave": "101",
  "physicalCardId": "68e59bee0693b68e94404e7c",    ← Debe aparecer
  "physicalCardNumber": "CM101",                     ← Debe aparecer
  "qrCode": "CM1011759878126511",                   ← Debe aparecer
  "noPhysicalCard": false
}
```

### 3. Si los campos NO aparecen:

Significa que `assignedCard` está `null`. Verifica:
- ¿Tocaste el botón "Asignar Tarjeta"?
- ¿Apareció el alert de confirmación?
- ¿El PhysicalCardButton muestra la tarjeta asignada?

### 4. Si los campos SÍ aparecen en el log pero no en la UI:

El problema está en el **backend**.

---

## 🔧 Solución Backend

### Problema: El backend NO está guardando los campos

El modelo de `Ingreso` o `Vehiculo` en el backend necesita incluir estos campos:

### Schema en MongoDB (backend):

```javascript
// models/Ingreso.js o models/Vehiculo.js
const ingresoSchema = new Schema({
  // ... campos existentes ...
  
  // Agregar campos de tarjeta física
  physicalCardId: {
    type: Schema.Types.ObjectId,
    ref: 'PhysicalCard',
    required: false,
  },
  physicalCardNumber: {
    type: String,
    required: false,
  },
  qrCode: {
    type: String,
    required: false,
  },
  noPhysicalCard: {
    type: Boolean,
    default: false,
  },
});
```

### Controller (backend):

```javascript
// controllers/vehiculoController.js o ingresoController.js

exports.createIngreso = async (req, res) => {
  try {
    const {
      patente,
      sector,
      nroLlave,
      // ... otros campos ...
      
      // AGREGAR estos campos
      physicalCardId,
      physicalCardNumber,
      qrCode,
      noPhysicalCard,
    } = req.body;
    
    const nuevoIngreso = new Ingreso({
      patente,
      sector,
      nroLlave,
      // ... otros campos ...
      
      // INCLUIR en el objeto
      physicalCardId,
      physicalCardNumber,
      qrCode,
      noPhysicalCard: noPhysicalCard || false,
    });
    
    await nuevoIngreso.save();
    res.status(201).json(nuevoIngreso);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## 🧪 Prueba Manual con curl

Para verificar que el backend está guardando correctamente:

```bash
curl -X POST https://carmanparking.com/api/vehiculos/ingresos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "patente": "TEST123",
    "sector": "A1",
    "nroLlave": "101",
    "establecimiento": "666236d2b6316ac455e22509",
    "physicalCardId": "68e59bee0693b68e94404e7c",
    "physicalCardNumber": "CM101",
    "qrCode": "CM1011759878126511",
    "noPhysicalCard": false
  }'
```

Luego consulta ese vehículo:
```bash
curl https://carmanparking.com/api/vehiculos/TEST123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

La respuesta debe incluir:
```json
{
  "_id": "...",
  "patente": "TEST123",
  "physicalCardId": "68e59bee0693b68e94404e7c",
  "physicalCardNumber": "CM101",
  "qrCode": "CM1011759878126511",
  "noPhysicalCard": false
}
```

---

## 🔍 Verificación en MongoDB

Conectarte a MongoDB y verificar:

```javascript
use CARMAN

// Ver un ingreso reciente
db.ingresos.findOne({}, { 
  patente: 1, 
  physicalCardId: 1, 
  physicalCardNumber: 1, 
  qrCode: 1,
  noPhysicalCard: 1 
}).sort({ _id: -1 })
```

Si los campos aparecen como `undefined` o no existen, el backend NO los está guardando.

---

## ✅ Checklist de Solución

### Frontend (Ya está completo ✅):
- [x] `VehicleForm.tsx` envía los datos
- [x] `VehicleCard.tsx` muestra el badge
- [x] `DetailsScreen.tsx` muestra el botón de información
- [x] Tipos TypeScript definidos
- [x] Estados de tarjeta manejados correctamente

### Backend (Verificar ⚠️):
- [ ] Modelo incluye campos de tarjeta física
- [ ] Controller acepta y guarda los campos
- [ ] API responde con los campos incluidos
- [ ] MongoDB tiene los campos en los documentos

---

## 🎯 Pasos para Solucionar

1. **Verificar logs del frontend** (presiona `j` en Expo)
2. **Confirmar que los datos se envían** (debe aparecer en `input:`)
3. **Revisar modelo del backend** (agregar campos si faltan)
4. **Actualizar controller del backend** (incluir campos en save)
5. **Probar con curl** (verificar respuesta)
6. **Verificar en MongoDB** (confirmar que se guardaron)
7. **Refrescar la app** (pulll to refresh en home)

---

## 🚀 Solución Rápida

Si quieres ver las tarjetas **inmediatamente** mientras se arregla el backend, puedes usar datos de prueba:

### Modificar temporalmente VehicleCard.tsx:

```typescript
// TEMPORAL - Solo para testing
const mockCard = vehicle.physicalCardNumber || "CM101"; // Forzar mostrar

{mockCard && (
  <View style={styles.cardBadge}>
    <CreditCard color={colors.white} size={10} />
  </View>
)}
```

Esto mostrará el badge en TODOS los vehículos para verificar que la UI funciona.

---

## 📞 Contacto Backend

Comparte este documento con el equipo de backend para que agreguen los campos necesarios en:
1. Schema de MongoDB
2. Controller de creación
3. Response de la API

Una vez implementado, las tarjetas se verán automáticamente en la app. ✨












