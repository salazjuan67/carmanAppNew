import { Platform } from 'react-native';
import { router } from 'expo-router';

/**
 * Lleva a la pantalla de login. En web usa asignación de URL para evitar errores de
 * Expo Router ("navigate before mounting Root Layout") con router.replace.
 */
export function replaceToAuthScreen(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const url = `${window.location.origin}/auth`;
    window.location.assign(url);
    return;
  }

  try {
    router.replace('/auth');
  } catch {
    setTimeout(() => {
      try {
        router.replace('/auth');
      } catch {
        /* último recurso nativo */
      }
    }, 150);
  }
}
