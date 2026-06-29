// File: app/(auth)/register.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated
} from 'react-native';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RegisterScreen() {
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

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'PLAYER' | 'CAPTAIN'>('PLAYER');

  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (username.length < 3 || username.includes(' ')) {
      Alert.alert('Error', 'Username must be at least 3 characters and contain no spaces.');
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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { 
            full_name: fullName.trim(),
            username: username.toLowerCase().trim(),
            role: role
          },
        },
      });

      if (error) throw error;

      if (data?.session && data?.user?.id) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: username.toLowerCase().trim(),
          full_name: fullName.trim(),
          role: role as any,
        }, { onConflict: 'id' });
      } else if (data?.user?.id) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInData?.session) {
          await supabase.from('profiles').update({ role: role as any })
            .eq('id', data.user.id);
          await supabase.auth.signOut();
        }
      }

      Alert.alert(
        'Account Created! ✅',
        `Welcome, ${role === 'CAPTAIN' ? 'Captain' : 'Player'}! You can now sign in.`,
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Could not create account.');
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            <View style={styles.brandContainer}>
              <Text style={[styles.logoText, { color: colors.primary }]}>11th MAN</Text>
              <Text style={[styles.tagline, { color: colors.subText }]}>Find your squad. Score your matches.</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

              <Text style={[styles.label, { color: colors.subText }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: focusedField === 'fullName' ? colors.primary : colors.border }]}
                placeholder="Enter your full name"
                placeholderTextColor={colors.subText}
                autoCapitalize="words"
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
              />

              <Text style={[styles.label, { color: colors.subText, marginTop: 16 }]}>Username</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: focusedField === 'username' ? colors.primary : colors.border }]}
                placeholder="e.g. babar_azam"
                placeholderTextColor={colors.subText}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
              />

              <Text style={[styles.label, { color: colors.subText, marginTop: 16 }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: focusedField === 'email' ? colors.primary : colors.border }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.subText}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />

              <Text style={[styles.label, { color: colors.subText, marginTop: 16 }]}>Account Type</Text>
              <View style={styles.roleContainer}>
                <TouchableOpacity 
                  style={[styles.roleBtn, { borderColor: role === 'PLAYER' ? colors.primary : colors.border, backgroundColor: role === 'PLAYER' ? colors.primaryBg : colors.background }]}
                  onPress={() => setRole('PLAYER')}
                >
                  <Text style={[styles.roleText, { color: role === 'PLAYER' ? colors.primary : colors.subText }]}>Player</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.roleBtn, { borderColor: role === 'CAPTAIN' ? colors.primary : colors.border, backgroundColor: role === 'CAPTAIN' ? colors.primaryBg : colors.background }]}
                  onPress={() => setRole('CAPTAIN')}
                >
                  <Text style={[styles.roleText, { color: role === 'CAPTAIN' ? colors.primary : colors.subText }]}>Captain / Admin</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.subText, marginTop: 16 }]}>Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: focusedField === 'password' ? colors.primary : colors.border }]}>
                <TextInput
                  style={[styles.inputField, { color: colors.text }]}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={colors.subText}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { color: colors.subText, marginTop: 16 }]}>Confirm Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: focusedField === 'confirmPassword' ? colors.primary : colors.border }]}>
                <TextInput
                  style={[styles.inputField, { color: colors.text }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.subText}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <AnimatedPressable
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleRegister}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Sign Up</Text>
                )}
              </AnimatedPressable>
            </View>

            <View style={styles.footer}>
              <Text style={{ color: colors.subText, fontSize: 13 }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Sign In</Text>
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
  roleContainer: { flexDirection: 'row', gap: 10 },
  roleBtn: { flex: 1, paddingVertical: 11, borderWidth: 1.5, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  roleText: { fontWeight: '700', fontSize: 13 },
  primaryButton: { width: '100%', borderRadius: 6, paddingVertical: 11, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  primaryButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
