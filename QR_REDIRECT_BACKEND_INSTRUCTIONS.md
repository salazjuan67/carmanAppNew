# 📋 Instrucciones para el Experto de Backend - Redirección QR

## 🎯 Objetivo
Implementar una redirección automática en el servidor `admin.carmanparking.com.ar` para que todos los QRs redirijan automáticamente al servidor de tickets.

## 📝 Especificaciones Técnicas

### 1. Endpoint a Implementar
```
GET /ticket/{id}
```

### 2. Comportamiento Esperado
- **URL de entrada**: `http://admin.carmanparking.com.ar/ticket/68bb6aacd422196e8c35b0e2`
- **Redirección automática a**: `http://149.50.128.181:3000/ticket/68bb6aacd422196e8c35b0e2`
- **Código de respuesta**: `302 Found` (redirección temporal)

## 🔧 Implementación Sugerida

### Para Express.js/Node.js
```javascript
app.get('/ticket/:id', (req, res) => {
  const { id } = req.params;
  const targetUrl = `http://149.50.128.181:3000/ticket/${id}`;
  res.redirect(302, targetUrl);
});
```

### Para Apache (.htaccess)
```apache
RewriteEngine On
RewriteRule ^ticket/(.*)$ http://149.50.128.181:3000/ticket/$1 [R=302,L]
```

### Para Nginx
```nginx
location /ticket/ {
    return 302 http://149.50.128.181:3000$request_uri;
}
```

## 🔧 Configuración Adicional

### Headers Recomendados
```javascript
res.set({
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
});
```

### Logging Sugerido
```javascript
console.log(`QR Redirect: ${req.ip} -> /ticket/${id} -> ${targetUrl}`);
```

## 🧪 Casos de Prueba

### URLs de Prueba
```
✅ http://admin.carmanparking.com.ar/ticket/68bb6aacd422196e8c35b0e2
✅ http://admin.carmanparking.com.ar/ticket/abc123def456
✅ http://admin.carmanparking.com.ar/ticket/test-id
```

### Respuestas Esperadas
- **Status Code**: `302 Found`
- **Location Header**: `http://149.50.128.181:3000/ticket/{id}`
- **Tiempo de respuesta**: < 100ms

## 📊 Monitoreo

### Métricas a Implementar
- Contador de redirecciones por día
- Tiempo de respuesta promedio
- Errores de redirección
- IPs únicas que acceden

### Logs Sugeridos
```javascript
// Log cada redirección
{
  timestamp: new Date().toISOString(),
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  ticketId: id,
  targetUrl: targetUrl,
  responseTime: Date.now() - startTime
}
```

## ⚠️ Consideraciones Importantes

### Validaciones
- Validar que el `id` no esté vacío
- Sanitizar el `id` para prevenir inyecciones
- Manejar caracteres especiales en el ID

### Manejo de Errores
```javascript
app.get('/ticket/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id || id.trim() === '') {
      return res.status(400).send('Invalid ticket ID');
    }
    
    const targetUrl = `http://149.50.128.181:3000/ticket/${encodeURIComponent(id)}`;
    res.redirect(302, targetUrl);
  } catch (error) {
    console.error('Redirect error:', error);
    res.status(500).send('Internal server error');
  }
});
```

## 🚀 Implementación Paso a Paso

1. **Crear el endpoint** `/ticket/:id` en el servidor
2. **Implementar la redirección** 302 al servidor de destino
3. **Agregar logging** para monitoreo
4. **Probar con URLs reales** de tickets
5. **Verificar** que la redirección funcione correctamente
6. **Monitorear** el rendimiento y errores

## 📞 Contacto
Si necesitas aclaraciones sobre la implementación, contacta al equipo de frontend para coordinar las pruebas.

---

**Fecha**: 20 de Octubre, 2024  
**Proyecto**: Carman Parking System  
**Prioridad**: Alta  
**Tiempo estimado**: 2-4 horas









