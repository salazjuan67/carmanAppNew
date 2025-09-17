import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../src/hooks/useAuth';
import '../global.css';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize } = useAuth();

  useEffect(() => {
    // Initialize auth service
    initialize();

    // Hide splash screen after auth initialization
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Remove initialize from dependencies

  return (
    <>
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
      </Stack>
    </>
  );
}