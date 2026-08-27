# 🔒 Implementación HTTPS en el Servidor

## 🎯 Objetivo
Configurar HTTPS en el servidor de tickets (`149.50.128.181:3000`) para resolver el error de Mixed Content.

## 📋 Pasos de Implementación

### 1. Generar Certificados SSL

#### Opción A: Certificados Auto-firmados (Desarrollo)
```bash
# En el servidor 149.50.128.181
mkdir -p /etc/ssl/carman
cd /etc/ssl/carman

# Generar clave privada
openssl genrsa -out carman-key.pem 2048

# Generar certificado auto-firmado
openssl req -new -x509 -key carman-key.pem -out carman-cert.pem -days 365 -subj "/C=AR/ST=BA/L=BA/O=Carman/OU=IT/CN=149.50.128.181"
```

#### Opción B: Certificados Let's Encrypt (Producción)
```bash
# Instalar certbot
sudo apt update
sudo apt install certbot

# Generar certificado
sudo certbot certonly --standalone -d 149.50.128.181
```

### 2. Configurar el Servidor Node.js

#### Para Express.js
```javascript
const https = require('https');
const fs = require('fs');
const express = require('express');
const app = express();

// Configuración SSL
const sslOptions = {
  key: fs.readFileSync('/etc/ssl/carman/carman-key.pem'),
  cert: fs.readFileSync('/etc/ssl/carman/carman-cert.pem')
};

// Crear servidor HTTPS
const httpsServer = https.createServer(sslOptions, app);

// Configurar CORS para HTTPS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://admin.carmanparking.com.ar');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Iniciar servidor HTTPS
httpsServer.listen(3000, '0.0.0.0', () => {
  console.log('🔒 Servidor HTTPS iniciado en puerto 3000');
});
```

### 3. Configurar Nginx como Proxy (Opcional)

#### Configuración Nginx
```nginx
server {
    listen 443 ssl;
    server_name 149.50.128.181;
    
    ssl_certificate /etc/ssl/carman/carman-cert.pem;
    ssl_certificate_key /etc/ssl/carman/carman-key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Actualizar URLs en el Frontend

#### En constants.ts
```typescript
export const API_CONFIG = {
  BASE_URL: 'https://carmanparking.com/api', // Cambiar a HTTPS
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export const API_ENDPOINTS = {
  // ... otros endpoints
  QR_ENDPOINT: 'https://admin.carmanparking.com.ar/ticket', // Cambiar a HTTPS
  // ... resto de endpoints
};
```

### 5. Configurar Redirección HTTP → HTTPS

#### En el servidor
```javascript
// Redireccionar HTTP a HTTPS
const http = require('http');
const httpApp = express();

httpApp.use((req, res) => {
  res.redirect(301, `https://${req.headers.host}${req.url}`);
});

http.createServer(httpApp).listen(80);
```

### 6. Script de Implementación Completa

#### deploy-https.sh
```bash
#!/bin/bash

echo "🔒 Implementando HTTPS en el servidor..."

# 1. Crear directorio SSL
sudo mkdir -p /etc/ssl/carman
cd /etc/ssl/carman

# 2. Generar certificados
echo "📜 Generando certificados SSL..."
sudo openssl genrsa -out carman-key.pem 2048
sudo openssl req -new -x509 -key carman-key.pem -out carman-cert.pem -days 365 -subj "/C=AR/ST=BA/L=BA/O=Carman/OU=IT/CN=149.50.128.181"

# 3. Configurar permisos
sudo chmod 600 carman-key.pem
sudo chmod 644 carman-cert.pem

# 4. Reiniciar servidor
echo "🔄 Reiniciando servidor..."
sudo systemctl restart carman-tickets

echo "✅ HTTPS implementado correctamente"
echo "🌐 Servidor disponible en: https://149.50.128.181:3000"
```

### 7. Verificación

#### Comandos de Prueba
```bash
# Probar HTTPS
curl -k https://149.50.128.181:3000/ticket/68bb6aacd422196e8c35b0e2

# Verificar certificado
openssl s_client -connect 149.50.128.181:3000 -servername 149.50.128.181

# Probar desde el navegador
https://149.50.128.181:3000/ticket/68bb6aacd422196e8c35b0e2
```

## 🔧 Configuración Adicional

### Firewall
```bash
# Abrir puerto 443
sudo ufw allow 443
sudo ufw allow 3000
```

### Logs SSL
```javascript
// Habilitar logs SSL
const https = require('https');
https.globalAgent.options.rejectUnauthorized = false; // Solo para desarrollo
```

## ⚠️ Consideraciones de Seguridad

1. **Certificados válidos**: Usar Let's Encrypt para producción
2. **CORS restringido**: Solo permitir dominios específicos
3. **Headers de seguridad**: Implementar HSTS, CSP, etc.
4. **Monitoreo**: Configurar logs de acceso SSL

## 📞 Contacto

Para implementar estos cambios, contactar al equipo de backend con esta documentación.

---

**Fecha**: 20 de Octubre, 2024  
**Proyecto**: Carman Parking System  
**Prioridad**: Alta  
**Tiempo estimado**: 2-3 horas









