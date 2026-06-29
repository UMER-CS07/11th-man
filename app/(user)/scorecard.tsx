// File: app/(user)/scorecard.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';

export default function ScorecardScreen() {
  const { matchId } = useLocalSearchParams();
  const mid = Array.isArray(matchId) ? matchId[0] : matchId;
  const { colors } = useTheme();
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mid) return;
    supabase.from('matches').select('*, balls(*)').eq('id', mid).single()
      .then(({ data }) => { if (data) setMatch(data); setLoading(false); });

    const ch = supabase.channel(`scorecard_${mid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${mid}` }, () => {
        supabase.from('matches').select('*, balls(*)').eq('id', mid).single().then(({ data }) => { if (data) setMatch(data); });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'balls', filter: `match_id=eq.${mid}` }, () => {
        supabase.from('matches').select('*, balls(*)').eq('id', mid).single().then(({ data }) => { if (data) setMatch(data); });
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [mid]);

  if (loading) return <SafeAreaWrapper style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></SafeAreaWrapper>;
  if (!match) return <SafeAreaWrapper style={[styles.center, { backgroundColor: colors.background }]}><Text style={{ color: colors.subText }}>Match not found.</Text></SafeAreaWrapper>;

  const firstBatKey = (() => {
    const tk = match.toss_winner === match.team_a ? 'team_a' : 'team_b';
    return match.elected_to === 'bat' ? tk : (tk === 'team_a' ? 'team_b' : 'team_a');
  })();
  const secondBatKey = firstBatKey === 'team_a' ? 'team_b' : 'team_a';
  const balls = match.balls ?? [];

  const inn1Balls = balls.filter((b: any) => b.inning_number === 1);
  const inn2Balls = balls.filter((b: any) => b.inning_number === 2);
  const inn1Legal = inn1Balls.filter((b: any) => b.extra_type !== 'wide' && b.extra_type !== 'noball').length;
  const inn2Legal = inn2Balls.filter((b: any) => b.extra_type !== 'wide' && b.extra_type !== 'noball').length;

  const inn1Score = firstBatKey === 'team_a' ? match.team_a_score : match.team_b_score;
  const inn1Wkts = firstBatKey === 'team_a' ? match.team_a_wickets : match.team_b_wickets;
  const inn2Score = secondBatKey === 'team_a' ? match.team_a_score : match.team_b_score;
  const inn2Wkts = secondBatKey === 'team_a' ? match.team_a_wickets : match.team_b_wickets;

  const target = inn1Score + 1;
  const isLive = match.status === 'in_progress';
  const isCompleted = match.status === 'completed';

  let resultText = '';
  if (isCompleted) {
    if (inn2Score > inn1Score) {
      const winsBy = 10 - inn2Wkts;
      resultText = `🏆 ${match[secondBatKey]} won by ${winsBy} wicket${winsBy !== 1 ? 's' : ''}`;
    } else if (inn1Score > inn2Score) {
      const margin = inn1Score - inn2Score;
      resultText = `🏆 ${match[firstBatKey]} won by ${margin} run${margin !== 1 ? 's' : ''}`;
    } else {
      resultText = `🤝 Match Tied!`;
    }
  }

  const getBatterStats = (inning: number) => {
    const inBalls = balls.filter((b: any) => b.inning_number === inning && b.batter_name);
    const map: Record<string, { runs: number; balls: number; fours: number; sixes: number; out: boolean }> = {};
    inBalls.forEach((b: any) => {
      if (!map[b.batter_name]) map[b.batter_name] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
      if (b.extra_type === 'none') { map[b.batter_name].balls++; map[b.batter_name].runs += b.runs; }
      if (b.runs === 4) map[b.batter_name].fours++;
      if (b.runs === 6) map[b.batter_name].sixes++;
      if (b.wicket) map[b.batter_name].out = true;
    });
    return Object.entries(map);
  };

  const getBowlerStats = (inning: number) => {
    const inBalls = balls.filter((b: any) => b.inning_number === inning && b.bowler_name);
    const map: Record<string, { runs: number; balls: number; wickets: number; wides: number; noballs: number }> = {};
    inBalls.forEach((b: any) => {
      if (!map[b.bowler_name]) map[b.bowler_name] = { runs: 0, balls: 0, wickets: 0, wides: 0, noballs: 0 };
      map[b.bowler_name].runs += b.runs + b.extra_runs;
      if (b.extra_type === 'none') map[b.bowler_name].balls++;
      if (b.wicket) map[b.bowler_name].wickets++;
      if (b.extra_type === 'wide') map[b.bowler_name].wides++;
      if (b.extra_type === 'noball') map[b.bowler_name].noballs++;
    });
    return Object.entries(map);
  };

  const renderBall = (b: any) => {
    const lbl = b.wicket ? 'W' : b.extra_type !== 'none' ? b.extra_type[0].toUpperCase() : String(b.runs);
    const bg = b.wicket ? colors.error : b.extra_type !== 'none' ? colors.warning : b.runs === 6 ? colors.violet : b.runs === 4 ? colors.sky : colors.surfaceRaised;
    const textColor = (b.wicket || b.extra_type !== 'none' || b.runs >= 4) ? '#ffffff' : colors.text;
    return (
      <View key={b.id} style={[styles.ballDot, { backgroundColor: bg, borderColor: colors.border }]}>
        <Text style={{ color: textColor, fontWeight: '900', fontSize: 11 }}>{lbl}</Text>
      </View>
    );
  };

  const Inn = ({ inning, teamKey, score, wkts, legal }: any) => {
    const batters = getBatterStats(inning);
    const bowlers = getBowlerStats(inning);
    const inBalls = balls.filter((b: any) => b.inning_number === inning);
    const overGroups: any[][] = [];
    let cur: any[] = [];
    let lCount = 0;
    inBalls.forEach((b: any) => {
      cur.push(b);
      if (b.extra_type === 'none') { lCount++; if (lCount % 6 === 0) { overGroups.push(cur); cur = []; } }
    });
    if (cur.length) overGroups.push(cur);

    return (
      <View style={{ marginBottom: 24 }}>
        {/* Inning header */}
        <View style={[styles.innHeader, { backgroundColor: colors.primary }]}>
          <Text style={[styles.innTeam, { color: '#ffffff' }]}>{match[teamKey]}</Text>
          <Text style={[styles.innScore, { color: '#ffffff' }]}>{score}/{wkts}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>({Math.floor(legal / 6)}.{legal % 6} ov)</Text>
        </View>

        {/* Batting table */}
        {batters.length > 0 && (
          <>
            <View style={[styles.tableHeader, { backgroundColor: colors.surface }]}>
              {['Batter', 'R', 'B', '4s', '6s', 'SR'].map((h, i) => (
                <Text key={h} style={[styles.thCell, { flex: i === 0 ? 2 : 1, color: colors.muted }]}>{h}</Text>
              ))}
            </View>
            {batters.map(([name, s], idx) => (
              <View key={name} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? colors.surface : colors.background, borderBottomColor: colors.border }]}>
                <View style={{ flex: 2 }}>
                  <Text style={[styles.tdName, { color: colors.text }]}>{name}</Text>
                  <Text style={{ color: s.out ? colors.error : colors.success, fontSize: 11, fontWeight: '700' }}>{s.out ? 'Out' : 'Not Out'}</Text>
                </View>
                <Text style={[styles.tdCell, { color: colors.text, fontWeight: '900' }]}>{s.runs}</Text>
                <Text style={[styles.tdCell, { color: colors.subText }]}>{s.balls}</Text>
                <Text style={[styles.tdCell, { color: colors.sky }]}>{s.fours}</Text>
                <Text style={[styles.tdCell, { color: colors.violet }]}>{s.sixes}</Text>
                <Text style={[styles.tdCell, { color: colors.subText }]}>{s.balls > 0 ? ((s.runs / s.balls) * 100).toFixed(0) : '0'}</Text>
              </View>
            ))}
          </>
        )}

        {/* Bowling table */}
        {bowlers.length > 0 && (
          <>
            <View style={[styles.tableHeader, { backgroundColor: colors.surface, marginTop: 12 }]}>
              {['Bowler', 'O', 'R', 'W', 'Eco'].map((h, i) => (
                <Text key={h} style={[styles.thCell, { flex: i === 0 ? 2 : 1, color: colors.muted }]}>{h}</Text>
              ))}
            </View>
            {bowlers.map(([name, s], idx) => (
              <View key={name} style={[styles.tableRow, { backgroundColor: idx % 2 === 0 ? colors.surface : colors.background, borderBottomColor: colors.border }]}>
                <Text style={[styles.tdName, { color: colors.text, flex: 2 }]}>{name}</Text>
                <Text style={[styles.tdCell, { color: colors.subText }]}>{Math.floor(s.balls / 6)}.{s.balls % 6}</Text>
                <Text style={[styles.tdCell, { color: colors.text }]}>{s.runs}</Text>
                <Text style={[styles.tdCell, { color: s.wickets > 0 ? colors.error : colors.text, fontWeight: '900' }]}>{s.wickets}</Text>
                <Text style={[styles.tdCell, { color: colors.subText }]}>{s.balls > 0 ? (s.runs / (s.balls / 6)).toFixed(1) : '0.0'}</Text>
              </View>
            ))}
          </>
        )}

        {/* Over by over */}
        {overGroups.length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Text style={[styles.sectionGroupLabel, { color: colors.muted }]}>OVER BY OVER</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            {overGroups.map((ov, i) => (
              <View key={i} style={styles.overRow}>
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', width: 34 }}>Ov {i + 1}</Text>
                <View style={styles.ballRow}>{ov.map(renderBall)}</View>
                <Text style={{ color: colors.subText, fontSize: 12 }}>
                  {ov.reduce((acc: number, b: any) => acc + b.runs + b.extra_runs, 0)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  function currentInningNum() {
    return (inn1Legal >= (match.total_overs * 6) || inn1Wkts >= 10) ? 2 : 1;
  }

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

        <Text style={[styles.pageTitle, { color: colors.text }]}>{match.team_a} vs {match.team_b}</Text>

        {isLive && (
          <View style={[styles.statusBadge, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}>
            <Text style={{ color: colors.error, fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>🔴 LIVE — Updates Automatically</Text>
          </View>
        )}
        {isCompleted && (
          <View style={[styles.statusBadge, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
            <Text style={[styles.resultTxt, { color: colors.primary }]}>{resultText}</Text>
          </View>
        )}

        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MetaRow label="Toss" value={`${match.toss_winner} (${match.elected_to})`} colors={colors} />
          <MetaRow label="Format" value={`${match.total_overs} overs`} colors={colors} />
          {currentInningNum() === 2 && !isCompleted && (
            <MetaRow label="Target" value={`${target} runs`} colors={colors} />
          )}
        </View>

        <Inn inning={1} teamKey={firstBatKey} score={inn1Score} wkts={inn1Wkts} legal={inn1Legal} />
        {inn2Balls.length > 0 && (
          <Inn inning={2} teamKey={secondBatKey} score={inn2Score} wkts={inn2Wkts} legal={inn2Legal} />
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

function MetaRow({ label, value, colors }: any) {
  return (
    <View style={styles.metaRow}>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 12, letterSpacing: -0.3 },
  statusBadge: { borderWidth: 1, borderRadius: 6, padding: 10, alignItems: 'center', marginBottom: 14 },
  resultTxt: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  metaCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  innHeader: { flexDirection: 'row', alignItems: 'baseline', padding: 16, borderRadius: 12, marginBottom: 10, gap: 10 },
  innTeam: { fontSize: 14, fontWeight: '700', flex: 1 },
  innScore: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 10, borderRadius: 8, marginBottom: 2 },
  thCell: { flex: 1, fontSize: 9, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, alignItems: 'center' },
  tdName: { fontSize: 13, fontWeight: '600' },
  tdCell: { flex: 1, textAlign: 'center', fontSize: 13 },
  sectionGroupLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  dividerLine: { height: 1, marginBottom: 10 },
  overRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  ballRow: { flexDirection: 'row', gap: 4, flex: 1, flexWrap: 'wrap' },
  ballDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
