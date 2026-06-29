// File: app/(auth)/login.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Required: ensures the browser session closes properly after OAuth redirect
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const redirectUrl = Linking.createURL('auth-callback');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
        if (result.type === 'success' && result.url) {
          const fragment = result.url.split('#')[1];
          if (fragment) {
            const params = new URLSearchParams(fragment);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            if (accessToken && refreshToken) {
              const { error: sessionErr } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (sessionErr) throw sessionErr;
            } else {
              Alert.alert('Sign-In Error', 'Could not extract tokens. Please try again.');
            }
          }
        } else if (result.type === 'cancel') {
          Alert.alert('Cancelled', 'Google sign-in was cancelled.');
        }
      }
    } catch (e: any) {
      Alert.alert('Google Sign-In Failed', e.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL('auth-callback');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (error) {
        Alert.alert(
          'Reset Email Sent',
          'If an account exists for ' + email.trim() + ', a reset link has been sent.\n\n' +
          'No email? You may not have registered yet — use Sign Up to create an account first.'
        );
      } else {
        Alert.alert(
          '📧 Check Your Email',
          'A password reset link has been sent to ' + email.trim() + '.\n\n' +
          'Tap the link in the email and you will be brought back here to set a new password.'
        );
      }
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address for magic link.');
      return;
    }
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL('auth-callback');
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
          shouldCreateUser: false,
        },
      });
      if (error) {
        if (error.message.toLowerCase().includes('not found') || error.message.toLowerCase().includes('signup')) {
          Alert.alert(
            'Account Not Found',
            'No account found for ' + email.trim() + '.\n\nPlease tap "Sign Up" to create an account first, then use magic link to log in.'
          );
        } else {
          throw error;
        }
        return;
      }
      Alert.alert(
        '📧 Check Your Email',
        'A magic link has been sent to ' + email.trim() + '.\n\nTap the link in the email to sign in instantly — no password needed!'
      );
    } catch (error: any) {
      Alert.alert('Magic Link Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.top}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            
            {/* Brand Header */}
            <View style={styles.brandContainer}>
              <Text style={[styles.logoText, { color: colors.primary }]}>11th MAN</Text>
              <Text style={[styles.tagline, { color: colors.subText }]}>Find your squad. Score your matches.</Text>
            </View>

            {/* Form Card */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
              
              <Text style={[styles.label, { color: colors.subText }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.background, 
                    color: colors.text, 
                    borderColor: emailFocused ? colors.primary : colors.border 
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={colors.subText}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />

              <Text style={[styles.label, { color: colors.subText, marginTop: 16 }]}>Password</Text>
              <View style={[
                styles.inputContainer, 
                { 
                  backgroundColor: colors.background, 
                  borderColor: passwordFocused ? colors.primary : colors.border 
                }
              ]}>
                <TextInput
                  style={[styles.inputField, { color: colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.subText}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={{ alignSelf: 'flex-end', marginTop: 12 }} onPress={() => router.push('/(auth)/password-reset')}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Forgot Password?</Text>
              </TouchableOpacity>

              <AnimatedPressable 
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleLogin}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
              </AnimatedPressable>

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.muted, backgroundColor: colors.surface }]}>OR</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>

              <AnimatedPressable 
                style={[styles.ghostButton, { borderColor: colors.borderStrong }]}
                onPress={handleMagicLink}
              >
                <Text style={[styles.ghostButtonText, { color: colors.subText }]}>🪄 Send Magic Link</Text>
              </AnimatedPressable>

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.muted, backgroundColor: colors.surface }]}>OR</Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>

              <AnimatedPressable
                style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={handleGoogleSignIn}
              >
                {googleLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={[styles.socialButtonText, { color: colors.text }]}>Continue with Google</Text>
                  </>
                )}
              </AnimatedPressable>
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
              <Text style={{ color: colors.subText, fontSize: 13 }}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Sign Up</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 40, paddingBottom: 40 },
  brandContainer: { alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 28, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  tagline: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  card: { padding: 18, borderRadius: 12, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 24 },
  label: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 11 },
  inputField: { flex: 1, fontSize: 14 },
  eyeIcon: { padding: 4 },
  primaryButton: { width: '100%', borderRadius: 6, paddingVertical: 11, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  primaryButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  divider: { flex: 1, height: 1 },
  dividerText: { paddingHorizontal: 10, fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  ghostButton: { width: '100%', borderRadius: 6, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  ghostButtonText: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  socialButton: { width: '100%', borderRadius: 6, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  socialButtonText: { fontSize: 14, fontWeight: '400' },
  googleIcon: { fontSize: 18, fontWeight: 'bold', color: '#4285F4', fontFamily: 'serif' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 }
});
