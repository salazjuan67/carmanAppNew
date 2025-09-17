import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Si no está autenticado, redirigir a login
      router.replace('/auth');
    }
  }, [isAuthenticated, isLoading]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return null; // O un componente de loading
  }

  // Si no está autenticado, no renderizar nada (se redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  // Si está autenticado, renderizar el contenido
  return <>{children}</>;
};
