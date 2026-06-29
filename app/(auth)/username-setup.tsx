// File: app/(auth)/username-setup.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UsernameSetupScreen() {
  const { session, refreshProfile } = useAuth();
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

  const [username, setUsername] = useState('');
  const [availability, setAvailability] = useState<'idle' | 'checking' | 'available' | 'taken' | 'short'>('idle');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (username.length === 0) { setAvailability('idle'); return; }
    if (username.length < 3) { setAvailability('short'); return; }
    if (username.includes(' ')) { setAvailability('taken'); return; }

    setAvailability('checking');
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase().trim())
        .neq('id', session?.user?.id ?? '')
        .maybeSingle();
      setAvailability(data ? 'taken' : 'available');
    }, 600);

    return () => clearTimeout(timer);
  }, [username]);

  const availabilityColor = () => {
    if (availability === 'available') return colors.success;
    if (availability === 'taken' || availability === 'short') return colors.error;
    if (availability === 'checking') return colors.muted;
    return colors.muted;
  };

  const availabilityText = () => {
    if (availability === 'idle') return '';
    if (availability === 'short') return '⚠ Must be at least 3 characters';
    if (availability === 'checking') return '⏳ Checking...';
    if (availability === 'available') return '✓ Username available!';
    if (availability === 'taken') return '✗ Username already taken';
    return '';
  };

  const handleSave = async () => {
    if (availability !== 'available') {
      Alert.alert('Invalid Username', 'Please choose a valid, available username.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.toLowerCase().trim() })
        .eq('id', session?.user?.id!);

      if (error) throw error;

      await refreshProfile?.();

      router.replace('/(user)/discover');
    } catch (e: any) {
      Alert.alert('Error', e.message);
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
          style={{ flex: 1, justifyContent: 'center', padding: 24 }}
        >
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <Text style={[styles.logoText, { color: colors.primary }]}>11th MAN</Text>
            <Text style={[styles.tagline, { color: colors.subText }]}>One last step before you join the squad!</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Choose Your Username</Text>
            <Text style={{ color: colors.subText, fontSize: 14, lineHeight: 22, marginBottom: 24 }}>
              This is how other players will find and message you. You can only set it once, so choose wisely!
            </Text>

            <Text style={[styles.label, { color: colors.subText }]}>Username</Text>
            <View style={[
              styles.inputRow, 
              { 
                borderColor: focused ? colors.primary : (availability === 'available' ? colors.success : availability === 'taken' ? colors.error : colors.border), 
                backgroundColor: colors.background 
              }
            ]}>
              <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 14 }}>@</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. babar_azam"
                placeholderTextColor={colors.subText}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={t => setUsername(t.replace(/\s/g, '').toLowerCase())}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
              {availability === 'checking' && <ActivityIndicator size="small" color={colors.subText} />}
              {availability === 'available' && <Text style={{ fontSize: 16 }}>✅</Text>}
              {(availability === 'taken' || availability === 'short') && <Text style={{ fontSize: 16 }}>❌</Text>}
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 16 }}>
              <Text style={{ color: availabilityColor(), fontSize: 11, fontWeight: '700' }}>
                {availabilityText()}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>
                {username.length} / 20
              </Text>
            </View>

            <AnimatedPressable
              style={[
                styles.primaryButton,
                { backgroundColor: availability === 'available' ? colors.primary : colors.muted }
              ]}
              onPress={handleSave}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Continue →</Text>
              )}
            </AnimatedPressable>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 28, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  tagline: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  card: { padding: 18, borderRadius: 12, borderWidth: 1 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3, marginBottom: 8 },
  label: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 11 },
  input: { flex: 1, fontSize: 14 },
  primaryButton: { width: '100%', borderRadius: 6, paddingVertical: 11, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  primaryButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
});
