// File: app/(auth)/auth-callback.tsx
// This screen handles the deep link redirect from Supabase OAuth (Google Sign-In).
// Supabase sends the user back to: 11thmanmobile://auth-callback#access_token=...
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      const parsed = Linking.parse(url);
      const fragment = url.split('#')[1];

      if (fragment) {
        const params = new URLSearchParams(fragment);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        const errorMsg = params.get('error_description') || params.get('error');

        if (errorMsg) {
          Alert.alert('Link Error', errorMsg.replace(/\+/g, ' '));
          router.replace('/(auth)/login');
          return;
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            if (type === 'recovery') {
              router.replace('/(auth)/update-password');
            } else {
              router.replace('/(user)/discover');
            }
            return;
          }
        }
      }
      router.replace('/(auth)/login');
    };

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ alignItems: 'center', opacity: fadeAnim }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.subText }]}>Signing you in...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 16, marginTop: 12 },
});
