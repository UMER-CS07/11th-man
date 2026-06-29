// File: app/(auth)/update-password.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UpdatePasswordScreen() {
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

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const [pwdFocused, setPwdFocused] = useState(false);
  const [confirmPwdFocused, setConfirmPwdFocused] = useState(false);

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        router.replace('/(user)/discover');
      }, 2000);
    } catch (error: any) {
      Alert.alert('Update Failed', error.message);
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
            
            <View style={styles.brandContainer}>
              <Text style={[styles.logoText, { color: colors.primary }]}>11th MAN</Text>
              <Text style={[styles.tagline, { color: colors.subText }]}>Account Recovery</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {success ? (
                <View style={[styles.successBanner, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}>
                  <Text style={[styles.successText, { color: colors.success }]}>Password updated successfully! Redirecting...</Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
                  <Text style={{ color: colors.subText, fontSize: 14, lineHeight: 22, marginBottom: 24 }}>Please enter your new password below.</Text>
                  
                  <Text style={[styles.label, { color: colors.subText }]}>New Password</Text>
                  <View style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: colors.background, 
                      borderColor: pwdFocused ? colors.primary : colors.border 
                    }
                  ]}>
                    <TextInput
                      style={[styles.inputField, { color: colors.text }]}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={colors.subText}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setPwdFocused(true)}
                      onBlur={() => setPwdFocused(false)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.label, { color: colors.subText, marginTop: 16 }]}>Confirm New Password</Text>
                  <View style={[
                    styles.inputContainer, 
                    { 
                      backgroundColor: colors.background, 
                      borderColor: confirmPwdFocused ? colors.primary : colors.border 
                    }
                  ]}>
                    <TextInput
                      style={[styles.inputField, { color: colors.text }]}
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.subText}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setConfirmPwdFocused(true)}
                      onBlur={() => setConfirmPwdFocused(false)}
                    />
                  </View>

                  <AnimatedPressable 
                    style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={handleUpdatePassword}
                  >
                    {loading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryButtonText}>Update Password</Text>
                    )}
                  </AnimatedPressable>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, padding: 24, paddingTop: 40, paddingBottom: 40 },
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 28, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  tagline: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  card: { padding: 18, borderRadius: 12, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8 },
  label: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 11 },
  inputField: { flex: 1, fontSize: 14 },
  eyeIcon: { padding: 4 },
  primaryButton: { width: '100%', borderRadius: 6, paddingVertical: 11, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  primaryButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  successBanner: { borderWidth: 1, borderRadius: 6, padding: 12 },
  successText: { fontSize: 12, fontWeight: '700', textAlign: 'center' }
});
