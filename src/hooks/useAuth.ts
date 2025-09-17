import { useState, useEffect, useCallback } from 'react';
import { authService, AuthState } from '../services/authService';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(authService.getAuthState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.subscribe((newState) => {
      setAuthState(newState);
    });

    return unsubscribe;
  }, []);

  const initialize = useCallback(async () => {
    return await authService.initialize();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    return await authService.login({ email, password });
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
  }, []);

  const refreshToken = useCallback(async () => {
    return await authService.refreshAuthToken();
  }, []);

  return {
    ...authState,
    initialize,
    login,
    logout,
    refreshToken,
  };
};
