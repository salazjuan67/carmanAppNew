import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../config/theme';
import { replaceToAuthScreen } from '../utils/replaceToAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Protege rutas que requieren sesión.
 * En web redirige con `location.assign` (evita fallos de router.replace).
 */
export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isLoading || isAuthenticated) {
      hasRedirected.current = false;
      return;
    }

    if (hasRedirected.current) return;
    hasRedirected.current = true;
    replaceToAuthScreen();
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.redirecting}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  redirecting: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blueBackGround,
  },
});
