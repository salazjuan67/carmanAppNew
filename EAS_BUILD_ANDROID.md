# Generar Android App Bundle (AAB) con EAS

Para publicar en Google Play, genera el AAB con:

```bash
cd /Users/juansebastiansalazar/Documents/GitHub/CarmanNewApp
npx eas-cli build --platform android --profile production --non-interactive
```

- El build usa las credenciales locales (`credentials.json` + `android/keystores/upload-keystore.jks`).
- Package de la app: `com.darey16.carman`.
- Cuando termine, descarga el `.aab` desde: https://expo.dev/accounts/jusalazar/projects/carman-jusalazar-app/builds

---

## Si aparece "certificate has expired"

Ese error suele ser por **VPN**, **Node desactualizado** o **fecha del sistema**. Prueba en este orden:

### 1. Desconectar VPN
Si usas VPN (p. ej. Argentina estando en otro país), **desactívala** solo durante el build. EAS no necesita estar en un país concreto y la VPN suele provocar este error.

### 2. Actualizar Node.js (certificados incluidos)
Node incluye su propio almacén de certificados CA. Una versión nueva trae CAs actualizados y suele quitar el error.

**Opción A – Desde la web (recomendado)**  
- Entra en https://nodejs.org/  
- Descarga la **versión LTS** (recomendada)  
- Instala y **reinicia la terminal**  
- Comprueba: `node -v` (debería ser v20.x o v22.x reciente)

**Opción B – Con Homebrew**
```bash
brew update && brew upgrade node
```
Luego cierra y abre la terminal y ejecuta de nuevo el build.

**Opción C – Con nvm (si ya lo usas)**
```bash
nvm install --lts
nvm use --lts
```

### 3. Fecha y hora del sistema
En macOS: **Ajustes → Fecha y hora** (o que esté activado “Ajustar fecha y hora automáticamente”).  
En terminal: `date` debe mostrar la fecha/hora correctas.

### 4. Probar con certificados del sistema (Node 23+)
Si instalaste Node 23 o superior, puedes forzar el uso de los certificados del sistema:
```bash
NODE_OPTIONS=--use-system-ca npx eas-cli build --platform android --profile production --non-interactive
```

### 5. Workaround temporal (solo si no hay otra opción)
Desactivar la verificación SSL **solo para este comando** (menos seguro). A veces aparece después **405 Method Not Allowed**; en ese caso prueba otra red (p. ej. datos del móvil).
```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 npx eas-cli build --platform android --profile production --non-interactive
```
