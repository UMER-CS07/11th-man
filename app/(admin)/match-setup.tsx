// File: app/(admin)/match-setup.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';

export default function MatchSetupScreen() {
  const { colors } = useTheme();
  const { session } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [overs, setOvers] = useState('');
  const [tossWinnerKey, setTossWinnerKey] = useState<'team_a' | 'team_b'>('team_a');
  const [electedTo, setElectedTo] = useState<'bat' | 'bowl'>('bat');
  const [loading, setLoading] = useState(false);

  const handleStartMatch = async () => {
    if (!teamA || !teamB || !overs) {
      Alert.alert('Missing Fields', 'Please enter both team names and the total overs.');
      return;
    }

    setLoading(true);
    const tossWinnerName = tossWinnerKey === 'team_a' ? teamA : teamB;

    const { data, error } = await supabase.from('matches').insert({
      scorer_id: session?.user?.id,
      team_a: teamA,
      team_b: teamB,
      total_overs: parseInt(overs),
      toss_winner: tossWinnerName,
      elected_to: electedTo,
      team_a_score: 0,
      team_b_score: 0,
      team_a_wickets: 0,
      team_b_wickets: 0,
      status: 'in_progress'
    }).select().single();

    if (error || !data) {
      Alert.alert('Setup Failed', error?.message || 'Could not start match.');
      setLoading(false);
    } else {
      router.replace({ pathname: '/(user)/scorer', params: { matchId: data.id } });
    }
  };

  return (
    <SafeAreaWrapper style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={[styles.header, { color: colors.text }]}>🏏 New Match Setup</Text>
        
        <TextInput 
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: focusedInput === 'teamA' ? colors.primary : colors.border }]} 
          placeholder="Team A Name" placeholderTextColor={colors.subText} 
          value={teamA} onChangeText={setTeamA} 
          onFocus={() => setFocusedInput('teamA')} onBlur={() => setFocusedInput(null)}
        />
        <TextInput 
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: focusedInput === 'teamB' ? colors.primary : colors.border }]} 
          placeholder="Team B Name" placeholderTextColor={colors.subText} 
          value={teamB} onChangeText={setTeamB} 
          onFocus={() => setFocusedInput('teamB')} onBlur={() => setFocusedInput(null)}
        />
        <TextInput 
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: focusedInput === 'overs' ? colors.primary : colors.border }]} 
          placeholder="Total Overs" placeholderTextColor={colors.subText} keyboardType="numeric" 
          value={overs} onChangeText={setOvers} 
          onFocus={() => setFocusedInput('overs')} onBlur={() => setFocusedInput(null)}
        />

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Toss Winner</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleBtn, { backgroundColor: tossWinnerKey === 'team_a' ? colors.primary : colors.surface, borderColor: tossWinnerKey === 'team_a' ? colors.primary : colors.border }]} 
            onPress={() => setTossWinnerKey('team_a')}>
            <Text style={{ color: tossWinnerKey === 'team_a' ? '#fff' : colors.text, fontWeight: 'bold' }}>Team A</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, { backgroundColor: tossWinnerKey === 'team_b' ? colors.primary : colors.surface, borderColor: tossWinnerKey === 'team_b' ? colors.primary : colors.border }]} 
            onPress={() => setTossWinnerKey('team_b')}>
            <Text style={{ color: tossWinnerKey === 'team_b' ? '#fff' : colors.text, fontWeight: 'bold' }}>Team B</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Elected To</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity 
            style={[styles.toggleBtn, { backgroundColor: electedTo === 'bat' ? colors.primary : colors.surface, borderColor: electedTo === 'bat' ? colors.primary : colors.border }]} 
            onPress={() => setElectedTo('bat')}>
            <Text style={{ color: electedTo === 'bat' ? '#fff' : colors.text, fontWeight: 'bold' }}>Bat</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleBtn, { backgroundColor: electedTo === 'bowl' ? colors.primary : colors.surface, borderColor: electedTo === 'bowl' ? colors.primary : colors.border }]} 
            onPress={() => setElectedTo('bowl')}>
            <Text style={{ color: electedTo === 'bowl' ? '#fff' : colors.text, fontWeight: 'bold' }}>Bowl</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]} 
          onPress={handleStartMatch} disabled={loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Starting...' : 'Start Match'}</Text>
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  input: { height: 50, borderWidth: 1, borderRadius: 6, paddingHorizontal: 16, marginBottom: 16, fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  toggleBtn: { flex: 0.48, padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  button: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 18 }
});
