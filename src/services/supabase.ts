// File: src/services/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Requirement 01: Access env values via expo-constants (from app.config.js extra block)
// Falls back to process.env for web/testing environments
const supabaseUrl =
  (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ??
  (process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined);

const supabaseAnonKey =
  (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ??
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined);

const safeSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeSupabaseAnonKey = supabaseAnonKey || 'public-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables! Check app.config.js extra block.');
}

// Initialize the client with session persistence configuration
export const supabase = createClient(safeSupabaseUrl, safeSupabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // Required for OAuth deep link token parsing
  },
});
