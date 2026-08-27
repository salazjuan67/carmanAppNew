# HTTPS_MIGRATION_FRONTEND_INSTRUCTIONS.md

## 🎯 **Objetivo**
Migrar la aplicación React Native Carman de HTTP a HTTPS para resolver errores de Mixed Content y mejorar la seguridad.

## 📋 **Estado Actual**
- ✅ **HTTPS configurado** en el servidor (Nginx + SSL)
- ✅ **Aplicación web funcionando** en `https://admin.carmanparking.com.ar`
- ❌ **URLs del frontend** aún usando HTTP
- ❌ **Errores de Mixed Content** en el navegador

## 🔧 **Cambios Requeridos**

### **1. Actualizar URLs en `src/config/constants.ts`**

**Archivo:** `src/config/constants.ts`

**Cambios necesarios:**

```typescript
// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://admin.carmanparking.com.ar', // ✅ CAMBIAR A HTTPS
  TIMEOUT: 10000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// ... resto del código sin cambios ...

// QR
QR_ENDPOINT: 'https://admin.carmanparking.com.ar/ticket', // ✅ CAMBIAR A HTTPS
```

### **2. Verificar otros archivos que usen URLs**

**Buscar en el proyecto:**
```bash
# Buscar referencias viejas al API en IP:4000 (debe dar 0 resultados en código)
grep -r "https://carmanparking.com/api" src/
grep -r "http://admin.carmanparking.com.ar" src/
```

**Archivos a revisar:**
- `src/services/` - Todos los servicios de API
- `src/hooks/` - Hooks que hagan llamadas HTTP
- `src/components/` - Componentes que usen URLs

### **3. Actualizar configuración de desarrollo**

**Si hay variables de entorno:**
```typescript
// .env o config de desarrollo
API_BASE_URL=https://admin.carmanparking.com.ar
QR_ENDPOINT=https://admin.carmanparking.com.ar/ticket
```

## 🚀 **Pasos de Implementación**

### **Paso 1: Backup**
```bash
# Crear backup del archivo actual
cp src/config/constants.ts src/config/constants.ts.backup
```

### **Paso 2: Actualizar URLs**
```typescript
// En src/config/constants.ts
export const API_CONFIG = {
  BASE_URL: 'https://admin.carmanparking.com.ar', // ✅ HTTPS
  // ... resto sin cambios
};

export const API_ENDPOINTS = {
  // ... todos los endpoints sin cambios
  QR_ENDPOINT: 'https://admin.carmanparking.com.ar/ticket', // ✅ HTTPS
};
```

### **Paso 3: Verificar otros archivos**
```bash
# Buscar todas las referencias HTTP
grep -r "http://" src/ --include="*.ts" --include="*.tsx"
```

### **Paso 4: Probar la aplicación**
```bash
# Reiniciar la aplicación
npx expo start --clear

# Probar login y funcionalidades
```

## 🔍 **Verificaciones Post-Implementación**

### **1. Verificar que no hay errores de Mixed Content**
- Abrir DevTools (F12)
- Verificar que no aparezcan errores de Mixed Content
- Confirmar que todas las peticiones usen HTTPS

### **2. Probar funcionalidades críticas**
- ✅ **Login** - Debe funcionar sin errores
- ✅ **QR Generation** - URLs deben usar HTTPS
- ✅ **API Calls** - Todas las peticiones deben ser HTTPS
- ✅ **Notifications** - SSE debe funcionar correctamente

### **3. Verificar logs del servidor**
```bash
# En el servidor, verificar logs
sudo tail -f /var/log/nginx/access.log
# Debe mostrar peticiones HTTPS exitosas
```

## 📱 **URLs Finales**

**Después de la migración:**
- **API Base:** `https://admin.carmanparking.com.ar`
- **QR Endpoint:** `https://admin.carmanparking.com.ar/ticket`
- **Login:** `https://admin.carmanparking.com.ar/api/auth/login`

## ⚠️ **Consideraciones Importantes**

### **1. Certificados SSL**
- El servidor usa certificados auto-firmados
- Los navegadores mostrarán advertencias de seguridad
- **Solución:** Aceptar la advertencia en el navegador

### **2. Compatibilidad**
- Verificar que todas las librerías soporten HTTPS
- Revisar configuraciones de CORS si es necesario

### **3. Testing**
- Probar en diferentes dispositivos
- Verificar que las notificaciones SSE funcionen
- Confirmar que el login funcione correctamente

## 🎯 **Resultado Esperado**

Después de implementar estos cambios:
- ✅ **Sin errores de Mixed Content**
- ✅ **Todas las peticiones usando HTTPS**
- ✅ **Login funcionando correctamente**
- ✅ **QR generation con URLs HTTPS**
- ✅ **Notificaciones SSE funcionando**

## 📞 **Soporte**

Si hay problemas durante la implementación:
1. Verificar logs del servidor
2. Revisar configuración de CORS
3. Confirmar que el servidor HTTPS esté funcionando
4. Probar con `curl -k https://admin.carmanparking.com.ar`

## 🔧 **Comandos de Diagnóstico**

### **Verificar URLs en el proyecto:**
```bash
# Buscar todas las referencias HTTP
grep -r "http://" src/ --include="*.ts" --include="*.tsx"

# Buscar IPs antiguas del API (puerto 4000)
grep -r "https://carmanparking.com/api" src/
grep -r "admin.carmanparking.com.ar" src/
```

### **Probar conectividad:**
```bash
# Probar HTTPS desde el servidor
curl -k https://admin.carmanparking.com.ar

# Probar endpoint específico
curl -k https://admin.carmanparking.com.ar/api/auth/login
```

### **Verificar configuración:**
```bash
# Verificar que el archivo se actualizó correctamente
cat src/config/constants.ts | grep -E "(BASE_URL|QR_ENDPOINT)"
```

## 📝 **Checklist de Implementación**

- [ ] **Backup** del archivo `constants.ts`
- [ ] **Actualizar** `BASE_URL` a HTTPS
- [ ] **Actualizar** `QR_ENDPOINT` a HTTPS
- [ ] **Buscar** otras referencias HTTP en el proyecto
- [ ] **Probar** la aplicación con HTTPS
- [ ] **Verificar** que no hay errores de Mixed Content
- [ ] **Confirmar** que el login funciona
- [ ] **Probar** generación de QR con HTTPS
- [ ] **Verificar** que las notificaciones SSE funcionan
- [ ] **Documentar** cualquier problema encontrado









