# Publicar Carman en App Store (iOS)

Bundle ID: `com.carmanapp.baires` (app existente en App Store Connect)  
Version: `14.2.0` (marketing) · `ios.buildNumber` empieza en `1` y se auto-incrementa con el profile `production-ios`.

Si App Store Connect ya tiene un buildNumber ≥ 1 para esta versión, subí `ios.buildNumber` en `app.json` a un número **mayor** que el último publicado.

## Prerrequisitos

1. Cuenta **Apple Developer Program** activa (la misma dueña de `com.carmanapp.baires`).
2. App existente en [App Store Connect](https://appstoreconnect.apple.com) con Bundle ID `com.carmanapp.baires`.
3. **Team ID** (developer.apple.com → Membership details).
4. Login EAS: `npx eas-cli login` (cuenta Expo: `jusalazar`).

### Team ID para OneSignal / firma NSE

Exportá el Team ID antes del build (o agregalo en `eas.json` → `build.production-ios.env`):

```bash
export EXPO_APPLE_TEAM_ID=XXXXXXXXXX
```

También podés setearlo en el dashboard de EAS Secrets como `EXPO_APPLE_TEAM_ID`.

## Credenciales iOS (remote / EAS)

El profile `production-ios` usa `credentialsSource: "remote"`. Android sigue en `production` / `preview` con `credentials.json` local.

```bash
cd /Users/juansebastiansalazar/Documents/GitHub/CarmanNewApp
npx eas-cli credentials -p ios
```

Elegí el profile **production-ios**, iniciá sesión con Apple ID y dejá que EAS cree Distribution Certificate + Provisioning Profile.

## Build

```bash
npm run build:ios
# equivalente:
npx eas-cli build --platform ios --profile production-ios
```

Seguí el build en: https://expo.dev/accounts/jusalazar/projects/carman-jusalazar-app/builds

## Submit → TestFlight

Cuando el build esté **finished**:

```bash
export EAS_NO_VCS=1
npm run submit:ios
# equivalente:
npx eas-cli submit --platform ios --profile production-ios --latest
```

El profile `production-ios` ya tiene `ascAppId: 6779470075` y `appleTeamId: A33553U39B`.

Si se queda en `waiting for an available submitter` más de ~15–20 min:

1. `Ctrl+C` (el job en la nube puede seguir o cancelarse).
2. Revisá en App Store Connect → TestFlight si ya apareció `14.2.0 (2)`.
3. Si no está, reintentá:
   ```bash
   export EAS_NO_VCS=1
   npx eas-cli submit --platform ios --profile production-ios --id 4247f3b2-dc9b-4926-b5e8-69382566b83c --wait
   ```

Te pedirá Apple ID + **app-specific password** (appleid.apple.com → Sign-In and Security → App-Specific Passwords)  
o usa la **API Key** ya creada en EAS (`F26MFFP6X3`).

Tras el submit, el build aparece en TestFlight (procesamiento ~5–30 min).

## Checklist App Store Connect (review)

- [ ] Nombre, subtítulo, categoría, clasificación por edad
- [ ] Privacy Policy URL
- [ ] Capturas iPhone (6.7" y 6.1" mínimo; iPad si dejás `supportsTablet: true`)
- [ ] Privacy nutrition labels (cuenta, datos de vehículos, etc.)
- [ ] Export compliance: ya está `ITSAppUsesNonExemptEncryption: false` en `app.json`
- [ ] Contacto de review + **cuenta demo** de operador (email/password + establecimiento de prueba)
- [ ] Notas de review: explicar cámara (OCR de patentes) y flujo de turnos/vehículos

## Crash en TestFlight — solución definitiva (build 14+)

Causa confirmada por crash logs (`build 4`):
- `SIGABRT` en `com.meta.react.turbomodulemanager.queue`
- `ObjCTurboModule::performVoidMethodInvocation` + frameworks OneSignal en el binario
- New Architecture ON

### Qué hace el build 14
1. **`newArchEnabled: false`** (app.json + expo-build-properties)
2. **Sin OneSignal SDK en iOS** (no `onesignal-expo-plugin` en EAS iOS; no autolink de `react-native-onesignal`)
3. **NSE stub** (`plugins/withStubNotificationServiceExtension`) con el mismo target/bundle que EAS ya firma, **sin** linkear OneSignal
4. Push iOS: `expo-notifications` + APNs. OneSignal solo Android.

```bash
export EAS_NO_VCS=1
export EXPO_APPLE_TEAM_ID=A33553U39B
npm run build:ios
# cuando termine:
npm run submit:ios
```

En el iPad: **borrá Carman**, instalá **14.2.0 (14)** desde TestFlight. No uses builds viejos (4/8/10/13).

Si el crash log no dice `"CFBundleVersion":"14"`, estás probando un build viejo.

## Scripts

| Script | Comando |
|--------|---------|
| `npm run build:ios` | EAS build iOS `production-ios` |
| `npm run submit:ios` | Submit del último build a App Store Connect / TestFlight |

## Notas

- Push Android: OneSignal. Push iOS: Expo/APNs (sin SDK OneSignal).
- New Architecture desactivada. NSE iOS es stub sin OneSignal.
