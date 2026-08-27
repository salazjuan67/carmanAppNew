# 🐛 Debug: Página de Ticket QR Muestra Datos Incompletos

## ❌ Problema Reportado

Al escanear el QR y entrar al link:
```
http://admin.carmanparking.com.ar/ticket/68e88a35b056a8a30f7f251b
```

La página muestra:
- ✅ Fecha: 10/10/2025
- ✅ Hora: 01:30 am
- ❌ Sector: **vacío**
- ❌ Llave: **vacío**
- ❌ Estado: Muestra "Estacionado" pero no es interactivo

---

## 🔍 Análisis

### ID del Ticket
```
68e88a35b056a8a30f7f251b
```

Este es el `_id` del **ingreso** en MongoDB.

### Endpoint del Backend
```
GET /ticket/:id
```

Este endpoint debe:
1. Buscar el ingreso por ID
2. Obtener todos los datos
3. Renderizar la página HTML con los datos completos

---

## 🧪 Verificación en MongoDB

### Buscar el ingreso en la base de datos:

```javascript
use CARMAN

// Buscar el ingreso específico
db.ingresosvehiculos.findOne({ 
  _id: ObjectId("68e88a35b056a8a30f7f251b") 
})
```

**Verificar que tenga:**
- ✅ `sector`: "A1" (o el sector que ingresaste)
- ✅ `nroLlave`: 101 (o el número de llave)
- ✅ `horaIngreso`: "01:30" 
- ✅ `estado`: "INGRESADO" o "ESTACIONADO"
- ✅ `patente`: la patente del vehículo

---

## 🔧 Problema en el Backend

### Posibles Causas:

#### 1. **El backend no está leyendo los campos correctamente**

```javascript
// ❌ Código problemático (backend)
app.get('/ticket/:id', async (req, res) => {
  const ingreso = await IngresoVehiculo.findById(req.params.id);
  
  res.render('ticket', {
    fecha: ingreso.created_at,
    hora: ingreso.horaIngreso,
    sector: ingreso.sector,        // ← Puede estar undefined
    llave: ingreso.nroLlave,       // ← Puede estar undefined
    estado: ingreso.estado
  });
});
```

#### 2. **Los campos no se guardaron en el ingreso**

Si al crear el ingreso no se guardaron `sector` y `nroLlave`, estarán vacíos.

#### 3. **Template HTML mal configurado**

El template puede estar buscando campos con nombres diferentes.

---

## 🔍 Debugging Backend

### Agregar logs en el endpoint `/ticket/:id`:

```javascript
app.get('/ticket/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log('📋 Buscando ticket:', id);
    
    const ingreso = await IngresoVehiculo.findById(id)
      .populate('vehiculo')
      .populate('establecimiento');
    
    if (!ingreso) {
      console.error('❌ Ingreso no encontrado:', id);
      return res.status(404).send('Ticket no encontrado');
    }
    
    // ═══════════════════════════════════════════════════
    // LOG COMPLETO DEL INGRESO
    // ═══════════════════════════════════════════════════
    console.log('📋 Ingreso encontrado:', {
      _id: ingreso._id,
      patente: ingreso.patente,
      sector: ingreso.sector,           // ← ¿Está definido?
      nroLlave: ingreso.nroLlave,       // ← ¿Está definido?
      horaIngreso: ingreso.horaIngreso,
      estado: ingreso.estado,
      created_at: ingreso.created_at
    });
    
    // Preparar datos para el template
    const templateData = {
      id: ingreso._id,
      patente: ingreso.patente || 'N/A',
      sector: ingreso.sector || 'Sin sector',      // ← Fallback
      llave: ingreso.nroLlave || 'Sin llave',      // ← Fallback
      horaIngreso: ingreso.horaIngreso || '00:00',
      fecha: ingreso.created_at 
        ? new Date(ingreso.created_at).toLocaleDateString('es-AR')
        : new Date().toLocaleDateString('es-AR'),
      estado: ingreso.estado || 'INGRESADO',
      establecimiento: ingreso.establecimiento?.nombre || 'Carman'
    };
    
    console.log('📄 Template data:', templateData);
    
    res.render('ticket', templateData);
    
  } catch (error) {
    console.error('❌ Error en /ticket/:id:', error);
    res.status(500).send('Error al cargar el ticket');
  }
});
```

---

## 🧪 Test Manual

### Verificar el ingreso en MongoDB:

```bash
mongosh "mongodb://tu_conexion/CARMAN"

use CARMAN

db.ingresosvehiculos.findOne(
  { _id: ObjectId("68e88a35b056a8a30f7f251b") },
  { 
    patente: 1, 
    sector: 1, 
    nroLlave: 1, 
    horaIngreso: 1,
    estado: 1,
    created_at: 1
  }
)
```

**Si los campos están vacíos (undefined o null):**
- El problema está en cómo se está creando el ingreso
- Verificar que el backend esté guardando `sector` y `nroLlave`

**Si los campos tienen valores:**
- El problema está en cómo el backend renderiza la página
- El template no está leyendo los campos correctamente

---

## 🔧 Solución Inmediata

### Opción 1: Verificar Creación del Ingreso

Cuando creas un vehículo desde la app, revisa los logs del backend:

```javascript
// Debe mostrar:
POST /api/vehiculos/ingresos
Body: {
  "patente": "ABC123",
  "sector": "A1",          // ← Debe estar presente
  "nroLlave": 101,         // ← Debe estar presente
  "horaIngreso": "01:30",
  ...
}

// Al guardar:
Ingreso creado: {
  _id: "68e88a35b056a8a30f7f251b",
  patente: "ABC123",
  sector: "A1",            // ← Debe guardarse
  nroLlave: 101,           // ← Debe guardarse
  ...
}
```

### Opción 2: Template HTML

Verificar que el template `views/ticket.ejs` (o similar) esté leyendo los campos correctamente:

```html
<!-- ❌ Incorrecto -->
<p>Sector: <%= vehiculo.sector %></p>
<p>Llave: <%= vehiculo.llave %></p>

<!-- ✅ Correcto -->
<p>Sector: <%= sector || 'N/A' %></p>
<p>Llave: <%= llave || nroLlave || 'N/A' %></p>
```

---

## 📊 Verificación Completa

### Test desde la App:

1. **Crear un vehículo de prueba:**
   - Patente: TEST999
   - Sector: A1
   - Llave: 101

2. **Ver los logs en la consola:**
   ```
   🚗 Input data: {
     "patente": "TEST999",
     "sector": "A1",       // ← Verificar que esté aquí
     "nroLlave": 101,      // ← Verificar que esté aquí
     ...
   }
   ```

3. **Verificar en MongoDB:**
   ```javascript
   db.ingresosvehiculos.findOne(
     { patente: "TEST999" },
     { sector: 1, nroLlave: 1 }
   )
   ```

4. **Abrir el QR en navegador**
   - Debe mostrar sector y llave

---

## 🎯 Solución Probable

El problema más común es que el **backend no está renderizando los campos** correctamente en la página HTML.

### Archivo a Revisar en el Backend:

```
backend/
  └── views/
      └── ticket.ejs  (o ticket.html, o ticket.pug)
```

**Asegurarse de que use:**
```html
<div>
  <span>Sector: <%= sector || ingreso.sector || 'N/A' %></span>
  <span>Llave: <%= nroLlave || ingreso.nroLlave || 'N/A' %></span>
</div>
```

---

## 📞 Compartir con Backend

**El equipo de backend necesita:**
1. Agregar logs en el endpoint `/ticket/:id`
2. Verificar que los datos se están leyendo de MongoDB
3. Verificar que el template HTML está renderizando los campos correctos
4. Usar valores por defecto si los campos están vacíos

El archivo completo de debugging está en `DEBUG_QR_TICKET_PAGE.md` para compartir con el backend. ✅












