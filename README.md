# Carman - Nueva Aplicación

Una aplicación moderna y eficiente para la gestión de vehículos en establecimientos, desarrollada con React Native y Expo SDK 54.

## 🚀 Características Principales

### ✨ Arquitectura Moderna
- **SDK 54** - Última versión de Expo
- **Expo Router** - Navegación basada en archivos
- **NativeWind** - Estilos con Tailwind CSS
- **TypeScript** - Tipado estático completo
- **Zustand** - Gestión de estado moderna
- **React Query** - Manejo de datos y caché

### 🎨 Diseño Moderno
- **Gradientes** - Diseño visual atractivo
- **Glassmorphism** - Efectos de cristal modernos
- **Iconos Lucide** - Iconografía consistente
- **Responsive** - Adaptable a diferentes pantallas
- **Tema Oscuro** - Interfaz elegante y moderna

### 🔔 Notificaciones Inteligentes
- **Notificaciones Locales** - Funcionamiento garantizado
- **Polling Inteligente** - Actualizaciones en tiempo real
- **Gestión de Estado** - Estado persistente
- **Configuración Flexible** - Personalizable por usuario

## 📱 Funcionalidades

### 🚗 Gestión de Vehículos
- Registro de vehículos con información completa
- Búsqueda y filtrado avanzado
- Estados de vehículos (ingresado, solicitado, retirado)
- Captura de imágenes de patentes
- Historial de operaciones

### 🏢 Establecimientos
- Gestión múltiple de establecimientos
- Configuración personalizada por establecimiento
- Roles y permisos de usuario
- Estadísticas y reportes

### 🔔 Notificaciones
- Notificaciones en tiempo real
- Configuración personalizable
- Historial de notificaciones
- Integración con sistema de turnos

### 👤 Gestión de Usuarios
- Autenticación segura
- Perfiles de usuario
- Roles y permisos
- Historial de actividad

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React Native** 0.81.4
- **Expo** SDK 54.0.7
- **TypeScript** 5.9.2
- **NativeWind** - Tailwind CSS para React Native
- **Expo Router** - Navegación basada en archivos

### Estado y Datos
- **Zustand** - Gestión de estado
- **React Query** - Manejo de datos y caché
- **AsyncStorage** - Almacenamiento local

### UI/UX
- **Lucide React Native** - Iconos
- **React Native Safe Area Context** - Áreas seguras
- **Expo Font** - Fuentes personalizadas

### Funcionalidades
- **Expo Notifications** - Notificaciones locales
- **Expo Camera** - Captura de imágenes
- **Expo Image Picker** - Selección de imágenes
- **Expo Secure Store** - Almacenamiento seguro

## 📁 Estructura del Proyecto

```
CarmanNewApp/
├── app/                    # Páginas de Expo Router
│   ├── _layout.tsx        # Layout principal
│   ├── index.tsx          # Pantalla de bienvenida
│   ├── auth.tsx           # Autenticación
│   ├── home.tsx           # Pantalla principal
│   └── profile.tsx        # Perfil de usuario
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── features/          # Funcionalidades por dominio
│   │   ├── auth/          # Autenticación
│   │   ├── vehicles/      # Gestión de vehículos
│   │   ├── notifications/ # Notificaciones
│   │   └── establishments/ # Establecimientos
│   ├── config/           # Configuración
│   ├── types/            # Tipos TypeScript
│   ├── utils/            # Utilidades
│   ├── hooks/            # Hooks personalizados
│   ├── services/         # Servicios
│   └── store/           # Estado global
├── assets/               # Recursos estáticos
├── global.css           # Estilos globales
└── tailwind.config.js   # Configuración de Tailwind
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Expo CLI
- Expo Go (para desarrollo)

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd CarmanNewApp

# Instalar dependencias
npm install

# Iniciar el servidor de desarrollo
npx expo start
```

### Configuración
1. **API Configuration**: Actualizar `src/config/constants.ts` con la URL de tu API
2. **Project ID**: Actualizar el `projectId` en `app.json` y `notificationService.ts`
3. **Fuentes**: Reemplazar los archivos de fuentes en `assets/fonts/`

## 📱 Desarrollo

### Comandos Disponibles
```bash
# Desarrollo
npm start                 # Iniciar servidor de desarrollo
npm run android          # Ejecutar en Android
npm run ios              # Ejecutar en iOS
npm run web              # Ejecutar en web

# Build
npx eas build --platform android --profile preview
npx eas build --platform ios --profile preview
```

### Estructura de Desarrollo
- **Páginas**: `app/` - Páginas de la aplicación
- **Componentes**: `src/components/` - Componentes reutilizables
- **Funcionalidades**: `src/features/` - Lógica de negocio por dominio
- **Servicios**: `src/services/` - Servicios externos
- **Hooks**: `src/hooks/` - Hooks personalizados
- **Tipos**: `src/types/` - Definiciones de TypeScript

## 🔧 Configuración Avanzada

### Notificaciones
- Configurar `projectId` en `notificationService.ts`
- Implementar backend para notificaciones push
- Configurar permisos en `app.json`

### API
- Actualizar endpoints en `src/config/constants.ts`
- Implementar servicios en `src/services/`
- Configurar interceptores de axios

### Estilos
- Personalizar colores en `tailwind.config.js`
- Agregar fuentes en `assets/fonts/`
- Modificar estilos globales en `global.css`

## 📊 Estado de Desarrollo

### ✅ Completado
- [x] Configuración inicial del proyecto
- [x] Estructura de carpetas moderna
- [x] Configuración de NativeWind
- [x] Páginas principales (Welcome, Auth, Home, Profile)
- [x] Servicio de notificaciones locales
- [x] Store con Zustand
- [x] Tipos TypeScript
- [x] Configuración de Expo Router

### 🚧 En Desarrollo
- [ ] Integración con API existente
- [ ] Gestión de vehículos
- [ ] Sistema de autenticación
- [ ] Notificaciones push
- [ ] Captura de imágenes
- [ ] Gestión de establecimientos

### 📋 Próximos Pasos
1. **Integración API**: Conectar con la API existente
2. **Funcionalidades Core**: Implementar gestión de vehículos
3. **Autenticación**: Sistema de login completo
4. **Notificaciones**: Implementar notificaciones push
5. **Testing**: Pruebas unitarias y de integración
6. **Deployment**: Configuración de EAS Build

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto, contacta al equipo de desarrollo.

---

**Carman** - Gestión Inteligente de Vehículos 🚗✨
