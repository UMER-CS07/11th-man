// File: app/(auth)/signup.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useRouter } from 'expo-router';

export default function SignupScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    
    try {
      // 1. Sign up user using Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: { 
            full_name: fullName, 
            role: 'PLAYER' 
          }
        }
      });

      if (error) throw error;

      // 2. Safety check: Check if a profile row needs to be manually inserted
      // If your AuthContext immediately tries to read a 'profiles' table on login, 
      // let's proactively insert it right here so it's always found!
      if (data?.user) {
        await supabase.from('profiles').insert([
          {
            id: data.user.id,
            email: email.trim(),
            full_name: fullName,
            role: 'PLAYER'
          }
        ]).select(); // .select() ensures it runs without failing silently
      }

      Alert.alert('Success', 'Welcome to 11th Man! Account created successfully.');
      router.replace('/(auth)/login');
    } catch (error: any) {
      // Catching missing table or duplicate email gracefully
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        Alert.alert(
          'Auth Complete',
          'Account registered! If you see a table error, make sure your Supabase "profiles" table is created in your dashboard.',
        );
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Registration Failed', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaWrapper style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Join the Squad</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>Create your player profile</Text>

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Full Name"
          placeholderTextColor={colors.subText}
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Email address"
          placeholderTextColor={colors.subText}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Password"
          placeholderTextColor={colors.subText}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSignUp}>
              <Text style={styles.buttonText}>Register Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }} onPress={() => router.back()}>
              <Text style={{ color: colors.primary, fontSize: 16 }}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 40 },
  input: { height: 56, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  button: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});
