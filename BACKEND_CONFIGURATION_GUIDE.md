# 🔧 Guía Completa de Configuración del Backend para Carman

Este documento contiene todas las instrucciones necesarias para configurar correctamente el backend y asegurar la compatibilidad con el frontend de la aplicación Carman.

---

## 📋 Tabla de Contenidos

1. [Configuración de CORS](#-configuración-de-cors)
2. [Manejo de Errores HTTP 422](#-manejo-de-errores-http-422)
3. [Formato de Respuestas de la API](#-formato-de-respuestas-de-la-api)
4. [Endpoints Requeridos](#-endpoints-requeridos)
5. [Troubleshooting](#-troubleshooting)

---

## 🌐 Configuración de CORS

### 📋 Problema

El frontend está intentando hacer peticiones AJAX desde `localhost:3000` (o desde el servidor) hacia el backend en `https://carmanparking.com/api`, pero el navegador está bloqueando estas peticiones por políticas de CORS (Cross-Origin Resource Sharing).

### ✅ Solución: Configurar CORS en el Backend

El backend necesita permitir peticiones desde el frontend agregando los headers CORS apropiados.

---

### 🚀 Opción 1: Si el Backend es Express.js / Node.js

#### Paso 1: Instalar el paquete `cors` (si no está instalado)

```bash
npm install cors
```

#### Paso 2: Configurar CORS en el archivo principal del servidor

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// Configuración de CORS
const corsOptions = {
  origin: [
    'http://localhost:3000',           // Desarrollo local
    'http://149.50.128.181:3000',      // Servidor frontend
    'https://admin.carmanparking.com.ar', // Producción
    'exp://localhost:8081',            // Expo development
    'exp://192.168.*.*:8081'            // Expo en red local
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept'
  ],
  exposedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));

// O si quieres permitir todos los orígenes (solo para desarrollo):
// app.use(cors());

// Resto de tu código...
```

#### Paso 3: Asegurarse de manejar preflight requests (OPTIONS)

```javascript
app.options('*', cors(corsOptions)); // Manejar preflight para todas las rutas
```

---

### 🚀 Opción 2: Si el Backend es NestJS

#### Paso 1: Instalar el paquete (si no está instalado)

```bash
npm install @nestjs/platform-express
```

#### Paso 2: Configurar CORS en `main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://149.50.128.181:3000',
      'https://admin.carmanparking.com.ar',
      'exp://localhost:8081',
      /^exp:\/\/192\.168\.\d+\.\d+:8081$/  // Expo en red local
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  });
  
  await app.listen(4000);
}
bootstrap();
```

---

### 🚀 Opción 3: Configuración Manual (Sin librerías)

Si prefieres configurar CORS manualmente:

```javascript
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://149.50.128.181:3000',
    'https://admin.carmanparking.com.ar',
    'exp://localhost:8081'
  ];
  
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin) || origin?.startsWith('exp://192.168.')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});
```

---

## ⚠️ Manejo de Errores HTTP 422

### 📋 Problema

El frontend está recibiendo errores HTTP 422 (Unprocessable Entity) que no se están manejando correctamente. Estos errores generalmente indican problemas de validación en el backend.

### ✅ Solución: Formato Estándar de Errores

El backend debe devolver errores en un formato consistente que el frontend pueda interpretar correctamente.

---

### 📝 Formato Esperado para Errores 422

El frontend espera recibir errores de validación en uno de los siguientes formatos:

#### Opción 1: Formato con Array de Errores (Recomendado)

```javascript
// Respuesta HTTP 422
{
  "success": false,
  "error": "Error de validación",
  "errors": [
    {
      "field": "email",
      "message": "El email es requerido"
    },
    {
      "field": "password",
      "message": "La contraseña debe tener al menos 6 caracteres"
    }
  ]
}
```

#### Opción 2: Formato con Mensaje Simple

```javascript
// Respuesta HTTP 422
{
  "success": false,
  "error": "El email es requerido",
  "message": "El email es requerido"
}
```

#### Opción 3: Formato con Objeto de Errores

```javascript
// Respuesta HTTP 422
{
  "success": false,
  "error": "Error de validación",
  "data": {
    "message": "Error de validación en los campos",
    "errors": {
      "email": "El email es requerido",
      "password": "La contraseña debe tener al menos 6 caracteres"
    }
  }
}
```

---

### 🔧 Implementación en Express.js

#### Ejemplo con Express Validator

```javascript
const { validationResult } = require('express-validator');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: 'Error de validación',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Uso en las rutas
app.post('/api/auth/login', [
  body('email').isEmail().withMessage('El email es inválido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
  handleValidationErrors
], loginController);
```

#### Ejemplo con Validación Manual

```javascript
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Validaciones
  const errors = [];
  
  if (!email) {
    errors.push({
      field: 'email',
      message: 'El email es requerido'
    });
  } else if (!/\S+@\S+\.\S+/.test(email)) {
    errors.push({
      field: 'email',
      message: 'El email es inválido'
    });
  }
  
  if (!password) {
    errors.push({
      field: 'password',
      message: 'La contraseña es requerida'
    });
  } else if (password.length < 6) {
    errors.push({
      field: 'password',
      message: 'La contraseña debe tener al menos 6 caracteres'
    });
  }
  
  // Si hay errores, devolver 422
  if (errors.length > 0) {
    return res.status(422).json({
      success: false,
      error: 'Error de validación',
      errors: errors
    });
  }
  
  // Continuar con la lógica de login...
});
```

---

### 🔧 Implementación en NestJS

#### Usando Class Validator

```typescript
import { Controller, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ValidationPipe } from '@nestjs/common';

class LoginDto {
  @IsEmail({}, { message: 'El email es inválido' })
  @IsNotEmpty({ message: 'El email es requerido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

@Controller('api/auth')
export class AuthController {
  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    // Tu lógica de login aquí
  }
}

// En main.ts, configurar el ValidationPipe global
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => {
    const formattedErrors = errors.map(error => ({
      field: error.property,
      message: Object.values(error.constraints || {})[0]
    }));
    
    throw new HttpException({
      success: false,
      error: 'Error de validación',
      errors: formattedErrors
    }, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}));
```

---

### 📋 Endpoints que Deben Manejar 422

Los siguientes endpoints deben devolver errores 422 cuando hay problemas de validación:

- `POST /api/auth/login` - Validar email y password
- `POST /api/auth/refresh` - Validar refresh token
- `POST /api/vehiculos` - Validar datos del vehículo
- `POST /api/vehiculos/ingresos` - Validar datos de ingreso
- `POST /api/physical-cards/assign-to-vehicle` - Validar asignación de tarjeta
- Cualquier endpoint que reciba datos del usuario

---

## 📦 Formato de Respuestas de la API

### ✅ Respuestas Exitosas

Todas las respuestas exitosas deben seguir este formato:

```javascript
// GET /api/vehiculos
{
  "success": true,
  "data": [
    { "id": 1, "patente": "ABC123", ... },
    { "id": 2, "patente": "XYZ789", ... }
  ],
  "message": "Vehículos obtenidos correctamente" // Opcional
}

// POST /api/auth/login
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "123",
      "email": "usuario@ejemplo.com",
      "nombre": "Juan",
      ...
    }
  },
  "message": "Login exitoso" // Opcional
}
```

### ❌ Respuestas de Error

Todas las respuestas de error deben seguir este formato:

```javascript
// Error 422 (Validación)
{
  "success": false,
  "error": "Error de validación",
  "errors": [...] // Array de errores específicos
}

// Error 401 (No autorizado)
{
  "success": false,
  "error": "No autorizado. Por favor inicia sesión nuevamente."
}

// Error 400 (Bad Request)
{
  "success": false,
  "error": "Solicitud inválida"
}

// Error 500 (Error del servidor)
{
  "success": false,
  "error": "Error interno del servidor"
}
```

---

## 📍 Endpoints Requeridos

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
  - Body: `{ email: string, password: string }`
  - Response: `{ success: true, data: { token: string, user: User } }`
  - Errores: 422 (validación), 401 (credenciales incorrectas)

- `POST /api/auth/logout` - Cerrar sesión
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ success: true }`

- `POST /api/auth/refresh` - Refrescar token
  - Body: `{ refreshToken: string }`
  - Response: `{ success: true, data: { token: string, refreshToken: string } }`

- `GET /api/auth/user` - Obtener perfil de usuario
  - Headers: `Authorization: Bearer {token}`
  - Response: `{ success: true, user: User }`

### Vehículos

- `GET /api/vehiculos` - Listar vehículos
- `GET /api/vehiculos/:id` - Obtener vehículo por ID
- `POST /api/vehiculos` - Crear vehículo
- `POST /api/vehiculos/ingresos` - Registrar ingreso
- `POST /api/vehiculos/ingresos/estado` - Cambiar estado de ingreso
- `GET /api/vehiculos/buscar?patente=ABC123` - Buscar por patente

### Tarjetas Físicas

- `POST /api/physical-cards/assign-to-vehicle` - Asignar tarjeta a vehículo
- `POST /api/physical-cards/assign-next` - Asignar siguiente tarjeta disponible
- `POST /api/physical-cards/:cardId/release` - Liberar tarjeta
- `GET /api/physical-cards/available` - Obtener tarjetas disponibles
- `GET /api/physical-cards/qr/:qrCode` - Buscar tarjeta por QR
- `GET /api/physical-cards/number/:cardNumber` - Buscar tarjeta por número

---

## 🔍 Verificación

### Paso 1: Reiniciar el Backend

```bash
# Si usas PM2
pm2 restart carman-backend

# O si ejecutas directamente
npm start
# o
node server.js
```

### Paso 2: Probar desde el Frontend

1. Abre el frontend en el navegador o en la app móvil
2. Abre la consola del navegador (F12) o los logs de la app
3. Intenta hacer login o cualquier operación
4. Verifica que las peticiones tengan status `200` o `422` (no `CORS error`)

### Paso 3: Verificar Headers en la Respuesta

En la pestaña Network del navegador, verifica que las respuestas del backend incluyan:

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With
```

### Paso 4: Probar Errores 422

Haz una petición de login con datos inválidos y verifica que la respuesta sea:

```json
{
  "success": false,
  "error": "Error de validación",
  "errors": [
    {
      "field": "email",
      "message": "El email es requerido"
    }
  ]
}
```

---

## 🐛 Troubleshooting

### Error: "Access-Control-Allow-Origin header is missing"

**Solución:** Asegúrate de que el backend esté enviando el header `Access-Control-Allow-Origin` en todas las respuestas.

**Verificación:**
```bash
curl -I -X OPTIONS https://carmanparking.com/api/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

Deberías ver `Access-Control-Allow-Origin` en los headers de respuesta.

---

### Error: "Preflight request failed"

**Solución:** Asegúrate de manejar las peticiones `OPTIONS` correctamente:

```javascript
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});
```

---

### Error: "Credentials flag is true, but Access-Control-Allow-Credentials is not set"

**Solución:** Si usas `credentials: true` en el frontend, asegúrate de tener `Access-Control-Allow-Credentials: true` en el backend:

```javascript
res.setHeader('Access-Control-Allow-Credentials', 'true');
```

---

### El CORS funciona en desarrollo pero no en producción

**Solución:** Verifica que el origen de producción esté incluido en la lista de `allowedOrigins`:

```javascript
origin: [
  'http://localhost:3000',
  'http://149.50.128.181:3000',
  'https://admin.carmanparking.com.ar' // ← Asegúrate de incluir este
]
```

---

### Error 422 no muestra mensajes descriptivos

**Solución:** Asegúrate de que el backend esté devolviendo errores en el formato esperado:

```javascript
// ❌ Incorrecto
res.status(422).json({ message: 'Error' });

// ✅ Correcto
res.status(422).json({
  success: false,
  error: 'Error de validación',
  errors: [
    { field: 'email', message: 'El email es requerido' }
  ]
});
```

---

### El frontend no puede parsear la respuesta de error

**Solución:** Asegúrate de que todas las respuestas de error tengan `Content-Type: application/json`:

```javascript
res.status(422).json({
  success: false,
  error: 'Error de validación'
});
// Express automáticamente establece Content-Type: application/json
```

---

## 📝 Notas Importantes

1. **Seguridad:** En producción, NO uses `origin: '*'` (permitir todos los orígenes). Siempre especifica los orígenes permitidos.

2. **Headers personalizados:** Si el frontend envía headers personalizados, deben estar en `allowedHeaders`.

3. **Métodos HTTP:** Asegúrate de incluir todos los métodos que usa el frontend (GET, POST, PUT, DELETE, PATCH, OPTIONS).

4. **Preflight:** Las peticiones con métodos no simples (POST con JSON, etc.) requieren un preflight request (OPTIONS) que debe ser manejado correctamente.

5. **Consistencia:** Todos los endpoints deben seguir el mismo formato de respuesta para errores y éxito.

6. **Validación:** Siempre valida los datos del usuario antes de procesarlos y devuelve errores 422 con mensajes descriptivos.

---

## 🔗 Recursos Adicionales

- [MDN: CORS](https://developer.mozilla.org/es/docs/Web/HTTP/CORS)
- [Express CORS Middleware](https://expressjs.com/en/resources/middleware/cors.html)
- [NestJS CORS](https://docs.nestjs.com/security/cors)
- [HTTP Status Codes](https://httpstatuses.com/)
- [Express Validator](https://express-validator.github.io/docs/)

---

## 📞 Contacto

Si después de seguir estas instrucciones el problema persiste, verifica:

1. ✅ Que el backend esté corriendo en el puerto 4000
2. ✅ Que no haya un firewall bloqueando las peticiones
3. ✅ Que el frontend esté haciendo las peticiones a la URL correcta (`https://carmanparking.com/api`)
4. ✅ Los logs del backend para ver si las peticiones están llegando
5. ✅ Que los headers CORS estén presentes en todas las respuestas (incluyendo errores)
6. ✅ Que los errores 422 sigan el formato especificado en este documento

---

## 📋 Checklist de Implementación

- [ ] CORS configurado con los orígenes correctos
- [ ] Preflight requests (OPTIONS) manejados correctamente
- [ ] Errores 422 devueltos en el formato especificado
- [ ] Todos los endpoints devuelven respuestas en el formato estándar
- [ ] Headers `Content-Type: application/json` en todas las respuestas
- [ ] Validación de datos implementada en todos los endpoints POST/PUT
- [ ] Mensajes de error descriptivos y en español
- [ ] Logs del backend configurados para debugging

---

**Última actualización:** Diciembre 2024
**Versión del Frontend:** 1.0.0
**URL del Backend:** `https://carmanparking.com/api`




