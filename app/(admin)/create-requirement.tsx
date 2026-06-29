// File: app/(admin)/create-requirement.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useAuth } from '@/src/context/AuthContext';

type RequirementMode = 'solo' | 'team';
type PlayerRole = 'batter' | 'bowler' | 'spinner' | 'all_rounder' | 'wicket_keeper';

const PLAYER_ROLES: { key: PlayerRole; label: string }[] = [
  { key: 'batter', label: 'Batter' },
  { key: 'bowler', label: 'Bowler' },
  { key: 'spinner', label: 'Spinner' },
  { key: 'all_rounder', label: 'All-Rounder' },
  { key: 'wicket_keeper', label: 'Wicket Keeper' }
];

export default function CreateRequirementScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [mode, setMode] = useState<RequirementMode>('team');
  const [matchDate, setMatchDate] = useState('');
  const [matchLocation, setMatchLocation] = useState('');
  const [requiredRoles, setRequiredRoles] = useState<PlayerRole[]>([]);
  const [teamNote, setTeamNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const toggleRequiredRole = (role: PlayerRole) => {
    setRequiredRoles((prev) => 
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const handlePublish = async () => {
    if (!matchDate || !matchLocation || (mode === 'solo' && requiredRoles.length === 0)) {
      Alert.alert('Missing Fields', 'Please set the date, location, and requirement details.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('requirements').insert({
      user_id: session?.user?.id,
      mode: mode,
      role_needed: mode === 'solo' ? requiredRoles.join(', ') : 'Opponent Team',
      venue: matchLocation,
      match_date: matchDate,
      notes: teamNote
    });

    if (error) {
      Alert.alert('Publish Error', error.message);
    } else {
      Alert.alert('Success', 'Requirement published to the marketplace!');
      router.push('/(user)/discover');
    }
    setLoading(false);
  };

  return (
    <SafeAreaWrapper style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[styles.header, { color: colors.text }]}>Post a Requirement</Text>

        {/* Mode Toggle */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Requirement Type</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleBtn, { backgroundColor: mode === 'solo' ? colors.primary : colors.surface, borderColor: mode === 'solo' ? colors.primary : colors.border }]} 
            onPress={() => setMode('solo')}>
            <Text style={{ color: mode === 'solo' ? '#fff' : colors.text, fontWeight: 'bold' }}>Need Players</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, { backgroundColor: mode === 'team' ? colors.primary : colors.surface, borderColor: mode === 'team' ? colors.primary : colors.border }]} 
            onPress={() => setMode('team')}>
            <Text style={{ color: mode === 'team' ? '#fff' : colors.text, fontWeight: 'bold' }}>Need Opponent Team</Text>
          </TouchableOpacity>
        </View>

        {/* Roles Selection (Only for Solo mode) */}
        {mode === 'solo' && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Needed Roles</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
          {PLAYER_ROLES.map((r) => {
            const isSelected = requiredRoles.includes(r.key);
            return (
              <TouchableOpacity
                key={r.key}
                onPress={() => toggleRequiredRole(r.key)}
                style={[
                  styles.chip,
                  { 
                    backgroundColor: isSelected ? colors.primary : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border
                  }
                ]}
              >
                <Text style={{ color: isSelected ? '#fff' : colors.subText, fontWeight: 'bold' }}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        </>
        )}

        {/* Details Form */}
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: focusedInput === 'venue' ? colors.primary : colors.border }]}
          placeholder="Match Venue / City"
          placeholderTextColor={colors.subText}
          value={matchLocation}
          onChangeText={setMatchLocation}
          onFocus={() => setFocusedInput('venue')}
          onBlur={() => setFocusedInput(null)}
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: focusedInput === 'date' ? colors.primary : colors.border }]}
          placeholder="Match Date (YYYY-MM-DD)"
          placeholderTextColor={colors.subText}
          value={matchDate}
          onChangeText={setMatchDate}
          onFocus={() => setFocusedInput('date')}
          onBlur={() => setFocusedInput(null)}
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: focusedInput === 'notes' ? colors.primary : colors.border, height: 100, textAlignVertical: 'top' }]}
          placeholder="Additional Notes..."
          placeholderTextColor={colors.subText}
          multiline
          maxLength={300}
          value={teamNote}
          onChangeText={setTeamNote}
          onFocus={() => setFocusedInput('notes')}
          onBlur={() => setFocusedInput(null)}
        />
        <Text style={{ color: colors.muted, textAlign: 'right', fontSize: 12, marginBottom: 16, marginTop: -10 }}>
          {teamNote.length}/300
        </Text>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]} 
          onPress={handlePublish}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Publishing...' : 'Publish to Marketplace'}</Text>
        </TouchableOpacity>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  input: { height: 50, borderWidth: 1, borderRadius: 6, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  button: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10, width: '100%' },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  toggleBtn: { flex: 0.48, padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ccc' }
});
