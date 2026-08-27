import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../src/hooks/useAuth';
import { QueryProvider } from '../src/providers/QueryProvider';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import '../global.css';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const { initialize } = useAuth();

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
    }, 800);

    void initialize().catch((e) => {
      console.warn('Auth initialize failed:', e);
    });

    return () => {
      clearTimeout(splashTimer);
    };
  }, []);

  // Restore session when app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to the foreground - restore session
        console.log('📱 App came to foreground - restoring session');
        initialize();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [initialize]);

  return (
    <LanguageProvider>
      <QueryProvider>
        <StatusBar style="light" backgroundColor="#081024" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#081024' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="home" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="vehicle/details" />
          <Stack.Screen name="vehicle/new" />
        </Stack>
      </QueryProvider>
    </LanguageProvider>
  );
}