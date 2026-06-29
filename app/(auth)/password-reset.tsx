// File: app/(auth)/password-reset.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Animated, ScrollView } from 'react-native';
import { supabase } from '@/src/services/supabase';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useTheme } from '@/src/context/ThemeContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

export default function PasswordResetScreen() {
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
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      const redirectUrl = Linking.createURL('auth-callback');
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
      
      Alert.alert(
        '📧 Check Your Email',
        'A password reset link has been sent to ' + email.trim() + '.\n\nTap the link in the email and you will be brought back here to set a new password.',
        [{ text: 'OK', onPress: () => router.push('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Reset Failed', error.message);
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
              <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
              <Text style={{ color: colors.subText, fontSize: 14, lineHeight: 22, marginBottom: 24 }}>
                Enter your email address and we'll send you a magic link to reset your password.
              </Text>

              <Text style={[styles.label, { color: colors.subText }]}>Email Address</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.background, 
                    color: colors.text, 
                    borderColor: focused ? colors.primary : colors.border 
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={colors.subText}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              
              <AnimatedPressable 
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleReset}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Send Link</Text>
                )}
              </AnimatedPressable>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>← Back to Sign In</Text>
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
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 28, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  tagline: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  card: { padding: 18, borderRadius: 12, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8 },
  label: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14 },
  primaryButton: { width: '100%', borderRadius: 6, paddingVertical: 11, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  primaryButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 }
});
