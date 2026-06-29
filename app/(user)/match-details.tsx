// File: app/(user)/match-details.tsx
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useTheme } from '@/src/context/ThemeContext';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

export default function MatchDetailsScreen() {
  const { colors } = useTheme();
  const { matchId } = useLocalSearchParams();
  const { session } = useAuth();
  const router = useRouter();
  const id = Array.isArray(matchId) ? matchId[0] : matchId;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    supabase
      .from('matches')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error) Alert.alert('Error', 'Could not load match details.');
        else setMatch(data);
        setLoading(false);
      });
  }, [id]);

  const getStatusColor = (s: string) => {
    if (s === 'in_progress' || s === 'live') return colors.success;
    if (s === 'completed') return colors.subText;
    return colors.primary;
  };

  const getStatusBg = (s: string) => {
    if (s === 'in_progress' || s === 'live') return colors.successBg;
    if (s === 'completed') return colors.surfaceRaised;
    return colors.primaryBg;
  };

  if (loading) return <SafeAreaWrapper style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></SafeAreaWrapper>;
  if (!match) return <SafeAreaWrapper style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.error }}>Match not found.</Text></SafeAreaWrapper>;

  const isMyMatch = match.scorer_id === session?.user?.id;
  const isLive = match.status === 'in_progress' || match.status === 'live';

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.ScrollView style={{ flex: 1, opacity: fadeAnim }} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBg(match.status) }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(match.status) }]} />
            <Text style={[styles.statusLabel, { color: getStatusColor(match.status) }]}>
              {match.status?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* VS Header */}
        <View style={[styles.vsCard, { backgroundColor: colors.primary }]}>
          <View style={styles.teamBlock}>
            <Text style={styles.teamLabel}>{match.team_a}</Text>
            <Text style={styles.bigScore}>{match.team_a_score}/{match.team_a_wickets}</Text>
          </View>
          <Text style={styles.vsBadge}>VS</Text>
          <View style={[styles.teamBlock, { alignItems: 'flex-end' }]}>
            <Text style={styles.teamLabel}>{match.team_b}</Text>
            <Text style={styles.bigScore}>{match.team_b_score}/{match.team_b_wickets}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionGroupLabel, { color: colors.muted }]}>MATCH DETAILS</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          {[
            { label: 'TOTAL OVERS', value: match.total_overs },
            { label: 'TOSS WINNER', value: match.toss_winner },
            { label: 'ELECTED TO', value: match.elected_to?.toUpperCase() },
          ].map((row) => (
            <View key={row.label} style={[styles.row, { borderBottomColor: colors.border }]}>
              <Text style={[styles.rowLabel, { color: colors.subText }]}>{row.label}</Text>
              <Text style={[styles.rowValue, { color: colors.text }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <AnimatedPressable
          style={[styles.btnOutline, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={() => router.push({ pathname: '/(user)/scorecard', params: { matchId: match.id } })}
        >
          <Text style={[styles.btnOutlineText, { color: colors.text }]}>📊 View Full Scorecard</Text>
        </AnimatedPressable>

        {isMyMatch && isLive && (
          <AnimatedPressable
            style={[styles.btnPrimary, { backgroundColor: colors.primary, marginTop: 12 }]}
            onPress={() => router.push({ pathname: '/(user)/scorer', params: { matchId: match.id } })}
          >
            <Text style={styles.btnPrimaryText}>▶ Continue Scoring</Text>
          </AnimatedPressable>
        )}
      </Animated.ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusLabel: { fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  vsCard: { borderRadius: 12, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  teamBlock: { flex: 1 },
  teamLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '700', marginBottom: 4 },
  bigScore: { color: '#ffffff', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  vsBadge: { color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: '900', marginHorizontal: 8 },
  detailCard: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20 },
  sectionGroupLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  dividerLine: { height: 1, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  rowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  rowValue: { fontSize: 13, fontWeight: '700' },
  btnOutline: { paddingVertical: 12, borderRadius: 6, alignItems: 'center', borderWidth: 1 },
  btnOutlineText: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  btnPrimary: { paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  btnPrimaryText: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', color: '#ffffff' },
});
