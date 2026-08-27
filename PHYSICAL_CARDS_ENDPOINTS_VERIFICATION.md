# Verificación de Endpoints de Tarjetas Físicas

## Estado de la Implementación

### ✅ Frontend - Configuración

#### 1. **Constants.ts - Endpoints Definidos**
```typescript
// Physical Cards
PHYSICAL_CARDS_ASSIGN_NEXT: '/api/physical-cards/assign-next',
PHYSICAL_CARDS_RELEASE: (cardId: string) => `/api/physical-cards/${cardId}/release`,
PHYSICAL_CARDS_AVAILABLE: '/api/physical-cards/available',
PHYSICAL_CARDS_BY_QR: (qrCode: string) => `/api/physical-cards/qr/${qrCode}`,
PHYSICAL_CARDS_BY_NUMBER: (cardNumber: string) => `/api/physical-cards/number/${cardNumber}`,
```

#### 2. **PhysicalCardService - Métodos Implementados**

##### `assignNextAvailableCard(establishmentId, establishmentName)`
- **Endpoint**: `POST /api/physical-cards/assign-next`
- **Body**: 
  ```json
  {
    "establishmentId": "string",
    "establishmentName": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "assignedCard": {
      "_id": "string",
      "cardNumber": "string",
      "qrCode": "string",
      "isActive": true,
      "isAssigned": true,
      "assignedVehicleId": "string",
      "assignedAt": "ISO Date",
      "establishmentId": "string",
      "establishmentCode": "string",
      "createdAt": "ISO Date",
      "updatedAt": "ISO Date"
    },
    "message": "string"
  }
  ```

##### `releaseCard(cardId)`
- **Endpoint**: `POST /api/physical-cards/{cardId}/release`
- **Body**: None
- **Response**: Empty (204 No Content)

##### `getAvailableCards(establishmentId)`
- **Endpoint**: `GET /api/physical-cards/available?establishmentId={establishmentId}`
- **Response**: 
  ```json
  [
    {
      "_id": "string",
      "cardNumber": "string",
      "qrCode": "string",
      "isActive": true,
      "isAssigned": false,
      "establishmentId": "string",
      "establishmentCode": "string",
      "createdAt": "ISO Date"
    }
  ]
  ```

##### `getCardByQR(qrCode)`
- **Endpoint**: `GET /api/physical-cards/qr/{qrCode}`
- **Response**: PhysicalCard object or null (404)

##### `getCardByNumber(cardNumber)`
- **Endpoint**: `GET /api/physical-cards/number/{cardNumber}`
- **Response**: PhysicalCard object or null (404)

---

## 🧪 Pruebas Manuales

### Preparación
1. Asegurarse de que el backend esté ejecutándose en `https://carmanparking.com/api`
2. Tener un token de autenticación válido
3. Tener un establecimiento válido en la base de datos

### Prueba 1: Asignar Tarjeta
```bash
curl -X POST https://carmanparking.com/api/physical-cards/assign-next \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "establishmentId": "666236d2b6316ac455e22509",
    "establishmentName": "Malloys"
  }'
```

**Resultado Esperado**: 
- Status: 200 OK
- Body: Objeto con `assignedCard` y `message`

### Prueba 2: Obtener Tarjetas Disponibles
```bash
curl -X GET "https://carmanparking.com/api/physical-cards/available?establishmentId=666236d2b6316ac455e22509" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resultado Esperado**: 
- Status: 200 OK
- Body: Array de tarjetas disponibles

### Prueba 3: Liberar Tarjeta
```bash
curl -X POST https://carmanparking.com/api/physical-cards/CARD_ID/release \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resultado Esperado**: 
- Status: 200 OK o 204 No Content

### Prueba 4: Buscar por QR
```bash
curl -X GET https://carmanparking.com/api/physical-cards/qr/CM1011703123456789 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resultado Esperado**: 
- Status: 200 OK (si existe) o 404 (si no existe)

### Prueba 5: Buscar por Número
```bash
curl -X GET https://carmanparking.com/api/physical-cards/number/CM101 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Resultado Esperado**: 
- Status: 200 OK (si existe) o 404 (si no existe)

---

## 📝 Checklist de Verificación Backend

### Modelo de Datos (MongoDB)
- [ ] Colección `physicalcards` creada
- [ ] Índices creados:
  - [ ] `cardNumber` (unique)
  - [ ] `qrCode` (unique)
  - [ ] `establishmentId`
  - [ ] `isActive`
  - [ ] `isAssigned`

### Controlador
- [ ] `assignNextAvailableCard` implementado
- [ ] `releaseCard` implementado
- [ ] `getAvailableCards` implementado
- [ ] `getCardByQR` implementado
- [ ] `getCardByNumber` implementado

### Rutas
- [ ] `POST /api/physical-cards/assign-next`
- [ ] `POST /api/physical-cards/:cardId/release`
- [ ] `GET /api/physical-cards/available`
- [ ] `GET /api/physical-cards/qr/:qrCode`
- [ ] `GET /api/physical-cards/number/:cardNumber`

### Lógica de Negocio
- [ ] Asignación de tarjetas en orden (prioriza números más bajos)
- [ ] Generación de QR único
- [ ] Validación de establecimiento
- [ ] Manejo de tarjetas ocupadas
- [ ] Liberación de tarjetas al entregar vehículo

### Seguridad
- [ ] Autenticación requerida en todos los endpoints
- [ ] Validación de permisos por establecimiento
- [ ] Sanitización de inputs

---

## 🔧 Manejo de Errores

### Errores Esperados

#### 400 Bad Request
- Falta `establishmentId` o `establishmentName`
- Formato de ID inválido

#### 401 Unauthorized
- Token inválido o expirado
- Token no proporcionado

#### 404 Not Found
- Tarjeta no encontrada por QR
- Tarjeta no encontrada por número
- Establecimiento no existe

#### 409 Conflict
- No hay tarjetas disponibles
- Tarjeta ya asignada

#### 500 Internal Server Error
- Error de conexión a base de datos
- Error en lógica de asignación

---

## 🎯 Flujo de Integración

### En el Frontend (App)

1. **Usuario ingresa vehículo**
   - Abre formulario de nuevo vehículo
   - Ve componente `PhysicalCardButton`

2. **Asignar tarjeta**
   - Usuario toca "Asignar Tarjeta"
   - App llama `physicalCardService.assignNextAvailableCard()`
   - Backend responde con tarjeta asignada
   - App muestra tarjeta en UI

3. **Cambiar tarjeta**
   - Usuario toca "Cambiar Tarjeta"
   - App llama `physicalCardService.getAvailableCards()`
   - Modal muestra lista de tarjetas
   - Usuario selecciona nueva tarjeta
   - App actualiza la tarjeta asignada

4. **Liberar tarjeta** (al entregar vehículo)
   - Usuario cambia estado a "Entregado"
   - App llama `physicalCardService.releaseCard(cardId)`
   - Tarjeta queda disponible para próximo vehículo

---

## ⚠️ Puntos Importantes

1. **Base URL**: `https://carmanparking.com/api`
2. **Autenticación**: Bearer Token requerido en todos los endpoints
3. **Headers**: `Content-Type: application/json`
4. **Timeout**: 10 segundos configurado en `API_CONFIG`
5. **Error Handling**: El servicio maneja automáticamente errores 404 para búsquedas por QR/número

---

## 🚀 Próximos Pasos

1. **Backend**: Implementar los endpoints según `PHYSICAL_CARDS_BACKEND_IMPLEMENTATION.md`
2. **Database**: Crear la colección y documentos de prueba en MongoDB
3. **Testing**: Ejecutar las pruebas manuales con curl
4. **Integration**: Probar desde la app React Native
5. **Production**: Validar en entorno de producción

---

## 📞 Soporte

Si hay errores en la integración:
1. Verificar que el backend esté corriendo
2. Verificar que haya tarjetas creadas en la base de datos
3. Verificar el token de autenticación
4. Revisar los logs del servidor
5. Verificar la conectividad de red












