/**
 * Token inválido / 401 desde APIs: limpia sesión local y navega al login.
 * Imports dinámicos para evitar ciclo apiClient → authService → apiClient.
 */
import { replaceToAuthScreen } from '../utils/replaceToAuth';

let handlingUnauthorized = false;

export async function navigateAfterSessionExpired(): Promise<void> {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  try {
    const { authService } = await import('./authService');
    await authService.clearLocalSessionAfterUnauthorized();
    replaceToAuthScreen();
  } catch (e) {
    console.error('❌ navigateAfterSessionExpired:', e);
  } finally {
    setTimeout(() => {
      handlingUnauthorized = false;
    }, 1500);
  }
}

/** Errores de vehículos/API tipo `HTTP 401: ...` — no reintentar polling. */
export function isNonRetryableVehicleHttpError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return (
    /\b401\b/.test(msg) ||
    /\b400\b/.test(msg) ||
    /no autorizado/i.test(msg) ||
    /unauthorized/i.test(msg) ||
    /token/i.test(msg)
  );
}

export function isSessionExpiredVehicleError(error: unknown): boolean {
  if (error == null) return false;
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes('401') || msg.includes('Sesión expirada');
}

export const SESSION_EXPIRED_USER_MESSAGE =
  'Sesión expirada. Por favor volvé a iniciar sesión.';
