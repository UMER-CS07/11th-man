// File: app/_layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Screens in (auth) group that are allowed even when session exists
const AUTH_SCREENS_ALLOWED_WHILE_LOGGED_IN = ['username-setup', 'update-password', 'auth-callback'];

function RootNavigationGuard() {
  const { session, role, profile, roleLoaded, initialized } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const currentPath = `/${segments.join('/')}`;

  const replaceIfNeeded = (path: string) => {
    if (currentPath !== path) {
      router.replace(path);
    }
  };

  useEffect(() => {
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inAdminGroup = segments[0] === '(admin)';
    const currentScreen = segments.length > 1 ? segments[1] : '';

    // Allow special auth screens to run even when logged in
    const isSpecialAuthScreen = AUTH_SCREENS_ALLOWED_WHILE_LOGGED_IN.includes(currentScreen);

    if (!session && !inAuthGroup) {
      // Not logged in → go to login
      replaceIfNeeded('/(auth)/login');

    } else if (session && inAuthGroup && !isSpecialAuthScreen) {
      // Logged in on a regular auth page → check if username setup needed
      if (roleLoaded && profile !== null && !profile?.username) {
        replaceIfNeeded('/(auth)/username-setup');
      } else if (roleLoaded) {
        replaceIfNeeded('/(user)/discover');
      }

    } else if (session && !inAuthGroup && !inAdminGroup) {
      // In the app — check if OAuth/Magic Link user needs a username
      // ONLY redirect if profile row loaded AND username field is truly empty
      if (roleLoaded && profile !== null && !profile?.username && currentScreen !== 'username-setup') {
        replaceIfNeeded('/(auth)/username-setup');
      }

    } else if (session && inAdminGroup) {
      // Block PLAYER role from admin screens
      if (role && role === 'PLAYER') {
        replaceIfNeeded('/(user)/discover');
      }
    }
  }, [session, initialized, segments, role, profile, roleLoaded]);

  if (!initialized) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(user)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <RootNavigationGuard />
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
