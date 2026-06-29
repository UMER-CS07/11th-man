import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useTheme } from '@/src/context/ThemeContext';

export default function PostMatchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaWrapper style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Post a Match</Text>
        
        {/* Winner Banner */}
        <View style={[styles.winnerBanner, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
          <Text style={{ color: colors.success, fontWeight: 'bold', textAlign: 'center' }}>Team A Won by 12 Runs!</Text>
        </View>

        <View style={styles.form}>
          <View style={[styles.input, { borderColor: colors.border }]}><Text style={{color: colors.subText}}>Select Team A</Text></View>
          <TextInput 
            style={[styles.scoreInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="0"
            placeholderTextColor={colors.subText}
            keyboardType="numeric"
            textAlign="center"
          />
          
          <View style={[styles.input, { borderColor: colors.border }]}><Text style={{color: colors.subText}}>Select Team B</Text></View>
          <TextInput 
            style={[styles.scoreInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            placeholder="0"
            placeholderTextColor={colors.subText}
            keyboardType="numeric"
            textAlign="center"
          />
          
          <View style={[styles.input, { borderColor: colors.border }]}><Text style={{color: colors.subText}}>Match Venue</Text></View>
          
          {/* Stats Summary */}
          <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ color: colors.text, fontWeight: 'bold' }}>Match Stats Summary</Text>
            <Text style={{ color: colors.subText, marginTop: 4 }}>Overs: 20 | Extras: 14 | Total Wickets: 12</Text>
          </View>

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={styles.btnText}>Schedule Match</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  winnerBanner: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 20 },
  form: { flex: 1 },
  input: { height: 50, borderWidth: 1, borderRadius: 8, marginBottom: 12, justifyContent: 'center', paddingHorizontal: 16 },
  scoreInput: { height: 70, borderWidth: 1, borderRadius: 8, marginBottom: 16, fontSize: 32, fontWeight: '900' },
  statsCard: { padding: 16, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  button: { height: 50, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 16, width: '100%' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
