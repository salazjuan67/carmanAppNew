# Firma Android para Google Play (keystore correcta)

Google Play exige que cada App Bundle esté firmado con **la misma clave** con la que se subió la app la primera vez. Si el AAB se firma con otra keystore, aparece:

> Tu Android App Bundle está firmado con la clave incorrecta...

---

## ¿Se puede descargar la clave de subida desde Google?

**No.** Google **nunca** te da un archivo .keystore o .jks para descargar. La clave de subida la generas **tú** en tu computadora. Lo que subes a Play Console es solo el **certificado público** (.pem), no la clave privada.

- Si **ya solicitaste el cambio de clave** y Google lo aprobó: en ese proceso tú generaste un .keystore/.jks y exportaste un .pem para subirlo. Ese archivo .keystore está **en tu Mac** (en la carpeta donde ejecutaste `keytool` o donde lo guardaste). Busca archivos como `upload.keystore`, `release.jks`, `carman.jks`, etc.
- Si **no encuentras** ese archivo: no hay “descarga” posible. Debes generar una **nueva** keystore (ver abajo), exportar el .pem y volver a solicitar el cambio de clave de subida en Play Console con ese nuevo certificado. Cuando Google lo acepte, usarás esa nueva keystore en `credentials.json`.

---

## Huella que debe tener tu keystore

La app debe estar firmada con el certificado con **esta** huella SHA1:

```
08:3D:95:4A:51:4F:FC:8D:F8:EA:8D:C6:25:7F:74:02:11:DD:4C:60
```

La huella que está usando EAS actualmente (incorrecta) es:

```
B8:F5:0A:7F:29:BE:02:D3:FD:64:00:99:D6:6D:FE:39:6A:0D:DB:4B
```

---

## Qué necesitas

1. **El archivo de keystore** (`.keystore` o `.jks`) que tiene SHA1 `08:3D:95...`
2. **Contraseña del keystore**
3. **Alias de la clave** (p. ej. `upload`, `key0`, `mykey`)
4. **Contraseña de la clave** (puede ser la misma que la del keystore)

Si no tienes ese keystore (otro equipo, otro desarrollador, etc.):

- Si usas **Firma de apps por Google Play**: en Play Console → Tu app → Configuración → Integridad de la app → Firma de la app, puedes ver/descargar el certificado de **clave de carga**. Si en su día subiste un keystore, ese es el que debes usar; si lo perdiste, Google permite solicitar una **rotación de clave de carga** (solo en algunos casos).
- Si **no** usas Firma por Google Play, la clave con la que firmaste el primer AAB es la única válida; sin ese archivo no podrás subir con la misma app.

---

## Comprobar la huella SHA1 de un keystore

Para ver si un `.keystore` o `.jks` es el correcto:

```bash
keytool -list -v -keystore ruta/a/tu/archivo.keystore -alias TU_ALIAS
```

Te pedirá la contraseña del keystore. En la salida busca algo como:

```
Alias name: upload
SHA1: 08:3D:95:4A:51:4F:FC:8D:F8:EA:8D:C6:25:7F:74:02:11:DD:4C:60
```

Si el SHA1 coincide con `08:3D:95:4A:51:4F:FC:8D:F8:EA:8D:C6:25:7F:74:02:11:DD:4C:60`, es la keystore correcta.

Si no recuerdas el alias:

```bash
keytool -list -v -keystore ruta/a/tu/archivo.keystore
```

Ahí se listan todos los alias y sus SHA1.

---

## Generar una nueva keystore (si no tienes la anterior)

Si pediste el cambio de clave pero no guardaste el .keystore, genera uno nuevo y vuelve a registrar el certificado en Play Console.

**1. Crear la carpeta y generar el keystore** (en la raíz del proyecto):

```bash
mkdir -p android/keystores
cd android/keystores
keytool -genkey -v -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass TU_KEYSTORE_PASSWORD \
  -keypass TU_KEY_PASSWORD \
  -alias upload \
  -keystore release.keystore \
  -dname "CN=Carman, OU=, O=, L=, S=, C=US"
```

Sustituye `TU_KEYSTORE_PASSWORD` y `TU_KEY_PASSWORD` por contraseñas seguras (pueden ser la misma). **Guárdalas:** las usarás en `credentials.json` y el alias es `upload`.

**2. Exportar el certificado público (.pem)** para subirlo a Google:

```bash
keytool -exportcert -rfc -keystore release.keystore -alias upload -file certificado-upload.pem
```

**3. En Play Console:** Integridad de la app → **Solicitar cambio de la clave de subida** → adjunta `certificado-upload.pem` y sigue el proceso. Cuando Google acepte la nueva clave, tu keystore será `android/keystores/release.keystore` (guárdala y haz copias de seguridad).

**4. Verificar la huella** (debe coincidir con la que muestre Play después de aceptar):

```bash
keytool -list -v -keystore android/keystores/release.keystore -alias upload
```

---

## Configurar el proyecto para usar esa keystore

El proyecto está configurado para usar **credenciales locales** (tu keystore en tu máquina).

### 1. Crear la carpeta del keystore

```bash
mkdir -p android/keystores
```

(La carpeta `android/keystores/` está en `.gitignore`; no se sube a Git.)

### 2. Copiar tu keystore

Copia tu archivo `.keystore` o `.jks` a:

```
android/keystores/release.keystore
```

(o otro nombre; luego lo usarás en `credentials.json`).

### 3. Crear `credentials.json`

En la **raíz del proyecto** (junto a `app.json`), crea `credentials.json` a partir del ejemplo:

```bash
cp credentials.json.example credentials.json
```

Edita `credentials.json` y rellena con **tus** datos:

```json
{
  "android": {
    "keystore": {
      "keystorePath": "android/keystores/release.keystore",
      "keystorePassword": "TU_KEYSTORE_PASSWORD",
      "keyAlias": "TU_KEY_ALIAS",
      "keyPassword": "TU_KEY_PASSWORD"
    }
  }
}
```

- `keystorePath`: ruta al archivo (relativa al proyecto o absoluta).
- `keystorePassword`: contraseña del keystore.
- `keyAlias`: alias de la clave (el que usaste en `keytool -list`).
- `keyPassword`: contraseña de la clave (a veces igual que `keystorePassword`).

**No subas `credentials.json` a Git** (ya está en `.gitignore`).

### 4. Generar el App Bundle

Con `credentials.json` y el keystore en su sitio:

```bash
npx eas-cli build --platform android --profile production --non-interactive
```

EAS usará la keystore indicada en `credentials.json` y el AAB quedará firmado con la huella que pide Play (`08:3D:95...`).

---

## Opción: subir la keystore a EAS (remote)

Si prefieres que EAS guarde la keystore en sus servidores en lugar de usar `credentials.json` en cada build:

1. Crea y rellena `credentials.json` como arriba.
2. Ejecuta:

   ```bash
   npx eas-cli credentials
   ```

3. Elige **Android** → **Credentials.json** → **Update credentials on Expo servers with values from credentials.json** (o la opción equivalente para subir desde `credentials.json`).
4. En `eas.json`, en el perfil `production`, **quita** `"credentialsSource": "local"` (o pon `"credentialsSource": "remote"`) para que los builds usen la keystore guardada en EAS.

A partir de ahí los builds de producción usarán la keystore correcta sin tener `credentials.json` en tu máquina.

---

## Resumen

| Qué quieres | Qué hacer |
|-------------|-----------|
| Firmar con la keystore que tiene SHA1 `08:3D:95...` | Usar ese `.keystore`/`.jks` en `credentials.json` y build con `production` (credenciales locales ya configuradas). |
| Verificar un keystore | `keytool -list -v -keystore <ruta> -alias <alias>`. |
| No tener la keystore correcta | Recuperarla o gestionar rotación de clave en Play Console (Firma de apps por Google Play). |

Cuando el AAB esté firmado con el certificado SHA1 `08:3D:95:4A:51:4F:FC:8D:F8:EA:8D:C6:25:7F:74:02:11:DD:4C:60`, Google Play aceptará la subida.
