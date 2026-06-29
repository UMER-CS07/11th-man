// File: app/(user)/scorer.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, TextInput, StyleSheet, Modal } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

export default function ScorerScreen() {
  const { matchId } = useLocalSearchParams();
  const mid = Array.isArray(matchId) ? matchId[0] : matchId;
  const { session } = useAuth();
  const { colors } = useTheme();

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [striker, setStriker] = useState('');
  const [nonStriker, setNonStriker] = useState('');
  const [bowler, setBowler] = useState('');
  const [awaitingBatter, setAwaitingBatter] = useState(false);
  const [awaitingBowler, setAwaitingBowler] = useState(false);
  const [newName, setNewName] = useState('');
  const [nameModal, setNameModal] = useState<'batter' | 'bowler' | null>(null);
  const prevInning = useRef<number>(1);

  useEffect(() => {
    if (!mid) return;
    supabase.from('matches').select('*, balls(*)').eq('id', mid).single()
      .then(({ data }) => { if (data) setMatch(data); setLoading(false); });

    const ch = supabase.channel(`scorer_${mid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${mid}` },
        () => supabase.from('matches').select('*, balls(*)').eq('id', mid).single().then(({ data }) => { if (data) setMatch(data); }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'balls', filter: `match_id=eq.${mid}` },
        () => supabase.from('matches').select('*, balls(*)').eq('id', mid).single().then(({ data }) => { if (data) setMatch(data); }))
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [mid]);

  const firstBatKey = useMemo(() => {
    if (!match) return 'team_a';
    const tk = match.toss_winner === match.team_a ? 'team_a' : 'team_b';
    return match.elected_to === 'bat' ? tk : (tk === 'team_a' ? 'team_b' : 'team_a');
  }, [match]);
  const secondBatKey = firstBatKey === 'team_a' ? 'team_b' : 'team_a';

  const inn1Legal = match?.balls?.filter((b: any) => b.inning_number === 1 && b.extra_type !== 'wide' && b.extra_type !== 'noball').length ?? 0;
  const inn2Legal = match?.balls?.filter((b: any) => b.inning_number === 2 && b.extra_type !== 'wide' && b.extra_type !== 'noball').length ?? 0;

  const inn1Wkts = firstBatKey === 'team_a' ? (match?.team_a_wickets ?? 0) : (match?.team_b_wickets ?? 0);
  const inn2Wkts = secondBatKey === 'team_a' ? (match?.team_a_wickets ?? 0) : (match?.team_b_wickets ?? 0);
  const inn1Score = firstBatKey === 'team_a' ? (match?.team_a_score ?? 0) : (match?.team_b_score ?? 0);
  const inn2Score = secondBatKey === 'team_a' ? (match?.team_a_score ?? 0) : (match?.team_b_score ?? 0);

  const maxBalls = (match?.total_overs ?? 0) * 6;
  const inn1Done = !!match && (inn1Wkts >= 10 || inn1Legal >= maxBalls);
  const currentInning: 1 | 2 = inn1Done ? 2 : 1;
  const legalDels = currentInning === 1 ? inn1Legal : inn2Legal;

  const batKey = currentInning === 1 ? firstBatKey : secondBatKey;
  const battingTeam = match?.[batKey];
  const batScore = currentInning === 1 ? inn1Score : inn2Score;
  const batWkts = currentInning === 1 ? inn1Wkts : inn2Wkts;
  const isTeamABat = batKey === 'team_a';

  const target = currentInning === 2 ? inn1Score + 1 : null;
  const runsNeeded = target ? target - inn2Score : null;
  const ballsLeft = maxBalls - legalDels;

  const inn2Done = currentInning === 2 && (inn2Wkts >= 10 || inn2Legal >= maxBalls || (target !== null && inn2Score >= target));
  const matchOver = inn2Done && match?.status !== 'completed';
  const canScore = match?.scorer_id === session?.user?.id && match?.status !== 'completed';

  useEffect(() => {
    if (matchOver && canScore) {
      let result = '';
      if (inn2Score > (target ? target - 1 : inn1Score)) {
        const winsBy = 10 - inn2Wkts;
        result = `${match[secondBatKey]} won by ${winsBy} wicket${winsBy !== 1 ? 's' : ''}!`;
      } else if (inn1Score > inn2Score) {
        const margin = inn1Score - inn2Score;
        result = `${match[firstBatKey]} won by ${margin} run${margin !== 1 ? 's' : ''}!`;
      } else {
        result = `🤝 Match Tied!`;
      }
      supabase.from('matches').update({ status: 'completed' }).eq('id', mid).then(() => {
        Alert.alert(result.includes('Tied') ? '🤝 Match Tied!' : '🏆 Match Over!', result, [
          { text: 'See Scorecard', onPress: () => router.replace({ pathname: '/(user)/scorecard', params: { matchId: mid } }) }
        ]);
      });
    }
  }, [inn2Done]);

  useEffect(() => {
    if (prevInning.current !== currentInning && currentInning === 2) {
      prevInning.current = 2;
      setStriker(''); setNonStriker(''); setBowler(''); setAwaitingBatter(false); setAwaitingBowler(false);
      Alert.alert(`🏏 Innings 2 Begins!`, `${match[secondBatKey]} need ${inn1Score + 1} runs in ${match.total_overs} overs to win.\n\nEnter opening batters and bowler.`);
    }
  }, [currentInning]);

  const swapStrike = () => { const t = striker; setStriker(nonStriker); setNonStriker(t); };

  const handleAction = async (runs: number, isWicket = false, extraType: 'none' | 'wide' | 'noball' = 'none') => {
    if (!canScore) return;
    if (!striker || !nonStriker || !bowler) { Alert.alert('⚠️ Players Not Set', 'Please enter striker, non-striker, and bowler names before scoring.'); return; }
    if (awaitingBatter || awaitingBowler) { Alert.alert('⏳ Action Required', awaitingBatter ? 'Enter the new batter name first.' : 'Set a new bowler for the next over.'); return; }

    const extraRuns = extraType !== 'none' ? 1 : 0;
    const totalRuns = runs + extraRuns;
    const isLegal = extraType === 'none';
    const newLegal = legalDels + (isLegal ? 1 : 0);
    const overComplete = isLegal && newLegal % 6 === 0 && newLegal > 0;

    const updatePayload = isTeamABat
      ? { team_a_score: batScore + totalRuns, team_a_wickets: batWkts + (isWicket ? 1 : 0) }
      : { team_b_score: batScore + totalRuns, team_b_wickets: batWkts + (isWicket ? 1 : 0) };

    try {
      await supabase.from('balls').insert({
        match_id: mid, runs, extra_runs: extraRuns, extra_type: extraType,
        wicket: isWicket, inning_number: currentInning,
        over_number: Math.floor(legalDels / 6) + 1,
        ball_number: (legalDels % 6) + 1,
        batter_name: striker, bowler_name: bowler,
      });
      await supabase.from('matches').update(updatePayload).eq('id', mid);

      let nextStriker = striker, nextNonStriker = nonStriker, nextBowler = bowler;
      let willNeedBatter = false, willNeedBowler = false;

      if (!isWicket && runs % 2 === 1) { let t = nextStriker; nextStriker = nextNonStriker; nextNonStriker = t; }
      if (isWicket) { nextStriker = ''; willNeedBatter = true; }
      if (overComplete) {
        let t = nextStriker; nextStriker = nextNonStriker; nextNonStriker = t;
        nextBowler = ''; willNeedBowler = true;
      }

      const updatedWickets = batWkts + (isWicket ? 1 : 0);
      const isInningsOver = updatedWickets >= 10 || newLegal >= maxBalls || (currentInning === 2 && target !== null && (batScore + totalRuns) >= target);

      if (isInningsOver) { willNeedBatter = false; willNeedBowler = false; }

      setStriker(nextStriker); setNonStriker(nextNonStriker); setBowler(nextBowler);
      setAwaitingBatter(willNeedBatter); setAwaitingBowler(willNeedBowler);

      if (willNeedBatter) setNameModal('batter');
      else if (willNeedBowler) setNameModal('bowler');
    } catch (e: any) { Alert.alert('Sync Error', e.message); }
  };

  if (loading || !match) return <SafeAreaWrapper style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors?.primary} /></SafeAreaWrapper>;

  const overStr = `${Math.floor(legalDels / 6)}.${legalDels % 6}`;
  const recentBalls = (match.balls ?? []).filter((b: any) => b.inning_number === currentInning).slice(-6);

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Name Entry Modal */}
      <Modal visible={!!nameModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderTopColor: colors.borderStrong }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.borderStrong }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {nameModal === 'batter' ? '🏏 New Batter Coming In' : '⚾ New Bowler for Next Over'}
            </Text>
            <Text style={{ color: colors.subText, marginBottom: 16, fontSize: 13, lineHeight: 20 }}>
              {nameModal === 'batter' ? 'A wicket has fallen. Enter the name of the next batter at the crease.' : 'Over complete! Enter the name of the bowler for the next over.'}
            </Text>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>{nameModal === 'batter' ? 'BATTER NAME' : 'BOWLER NAME'}</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder={nameModal === 'batter' ? 'e.g. Ali Raza' : 'e.g. Hassan Khan'}
              placeholderTextColor={colors.subText}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <AnimatedPressable
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: newName.trim().length < 2 ? 0.5 : 1 }]}
              onPress={() => {
                if (newName.trim().length < 2) return;
                if (nameModal === 'batter') {
                  if (!striker) setStriker(newName.trim()); else setNonStriker(newName.trim());
                  setAwaitingBatter(false); setNewName('');
                  if (awaitingBowler) setNameModal('bowler'); else setNameModal(null);
                } else {
                  setBowler(newName.trim()); setAwaitingBowler(false); setNewName(''); setNameModal(null);
                }
              }}
            >
              <Text style={styles.primaryBtnText}>Confirm</Text>
            </AnimatedPressable>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.screenHeader, { color: colors.text }]}>
          {match.status === 'completed' ? '🏆 Match Completed' : `Live Scorer — Inning ${currentInning}`}
        </Text>

        {/* Scoreboard */}
        <View style={[styles.scoreboard, { backgroundColor: colors.primary }]}>
          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '700', opacity: 0.85 }}>{battingTeam}</Text>
          <Text style={[styles.sbScore, { color: '#ffffff' }]}>{batScore}/{batWkts}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600' }}>Overs: {overStr} / {match.total_overs}</Text>
          {currentInning === 2 && target !== null && (
            <View style={styles.targetRow}>
              <Text style={styles.targetChip}>Target: {target}</Text>
              <Text style={styles.targetChip}>Need: {Math.max(0, runsNeeded!)} in {ballsLeft} balls</Text>
            </View>
          )}
        </View>

        {/* Recent balls */}
        {recentBalls.length > 0 && (
          <View style={styles.ballRow}>
            {recentBalls.map((b: any) => {
              const lbl = b.wicket ? 'W' : b.extra_type !== 'none' ? b.extra_type[0].toUpperCase() : String(b.runs);
              const bg = b.wicket ? colors.error : b.extra_type !== 'none' ? colors.warning : b.runs === 4 ? colors.sky : b.runs === 6 ? colors.violet : colors.surfaceRaised;
              const tc = (b.wicket || b.extra_type !== 'none' || b.runs >= 4) ? '#ffffff' : colors.text;
              return (
                <View key={b.id} style={[styles.ballDot, { backgroundColor: bg, borderColor: colors.border }]}>
                  <Text style={{ color: tc, fontWeight: '900', fontSize: 12 }}>{lbl}</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* View-only notice */}
        {!canScore && (
          <View style={[styles.noticeBar, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
            <Text style={{ color: colors.warning, fontWeight: '700', fontSize: 12 }}>👁 View Only — You are not the scorer for this match.</Text>
          </View>
        )}

        {canScore && match.status !== 'completed' && (
          <>
            {/* Setup guide */}
            {(!striker || !nonStriker || !bowler) && (
              <View style={[styles.noticeBar, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>📋 Setup Required</Text>
                <Text style={{ color: colors.subText, fontSize: 12, marginTop: 4 }}>
                  {!striker && !nonStriker ? 'Enter both opening batters and the opening bowler to begin scoring.' :
                   !striker ? 'Enter the striker (batter facing).' :
                   !nonStriker ? 'Enter the non-striker.' : 'Enter the current bowler.'}
                </Text>
              </View>
            )}

            {/* Players panel */}
            <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.panelTitle, { color: colors.text }]}>🏏 Live Players</Text>
              <View style={styles.fieldRow}>
                <View style={[styles.fieldBox, { borderColor: striker ? colors.primary : colors.border, backgroundColor: colors.background }]}>
                  <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' }}>STRIKER ⚡</Text>
                  <TextInput style={[styles.fieldInput, { color: colors.text }]} placeholder="Batter facing" placeholderTextColor={colors.subText} value={striker} onChangeText={setStriker} editable={!awaitingBatter} />
                </View>
                <TouchableOpacity style={[styles.swapBtn, { backgroundColor: colors.primary }]} onPress={swapStrike}>
                  <Text style={{ color: '#ffffff', fontSize: 18 }}>⇄</Text>
                </TouchableOpacity>
                <View style={[styles.fieldBox, { borderColor: nonStriker ? colors.primary : colors.border, backgroundColor: colors.background }]}>
                  <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' }}>NON-STRIKER</Text>
                  <TextInput style={[styles.fieldInput, { color: colors.text }]} placeholder="Other batter" placeholderTextColor={colors.subText} value={nonStriker} onChangeText={setNonStriker} />
                </View>
              </View>
              <View style={[styles.fieldBox, { borderColor: bowler ? colors.primary : colors.border, marginTop: 10, backgroundColor: colors.background }]}>
                <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' }}>BOWLER ⚾</Text>
                <TextInput style={[styles.fieldInput, { color: colors.text }]} placeholder="Current bowler" placeholderTextColor={colors.subText} value={bowler} onChangeText={setBowler} editable={!awaitingBowler} />
              </View>
            </View>

            {/* Run buttons */}
            <Text style={[styles.panelTitle, { color: colors.text, marginBottom: 10 }]}>Score This Ball</Text>
            {/* Row 1: 0, 1, 2, 3 */}
            <View style={styles.runRow}>
              {[0, 1, 2, 3].map(r => (
                <AnimatedPressable
                  key={r}
                  style={[styles.runBtn, {
                    backgroundColor: colors.surfaceRaised,
                    borderColor: colors.border,
                  }]}
                  onPress={() => handleAction(r)}
                >
                  <Text style={[styles.runBtnNum, { color: colors.text }]}>{r}</Text>
                  <Text style={{ color: colors.muted, fontSize: 9, fontWeight: '700' }}>runs</Text>
                </AnimatedPressable>
              ))}
            </View>
            {/* Row 2: 4, 6 */}
            <View style={[styles.runRow, { marginTop: 10, marginBottom: 14 }]}>
              {[4, 6].map(r => (
                <AnimatedPressable
                  key={r}
                  style={[styles.runBtn, {
                    backgroundColor: r === 4 ? colors.skyBg : colors.violetBg,
                    borderColor: r === 4 ? colors.skyBorder : colors.violetBorder,
                  }]}
                  onPress={() => handleAction(r)}
                >
                  <Text style={[styles.runBtnNum, { color: r === 4 ? colors.sky : colors.violet }]}>{r}</Text>
                  <Text style={{ color: r === 4 ? colors.sky : colors.violet, fontSize: 9, fontWeight: '700' }}>
                    {r === 4 ? 'FOUR' : 'SIX'}
                  </Text>
                </AnimatedPressable>
              ))}
            </View>

            {/* Special buttons */}
            <View style={styles.extraRow}>
              <AnimatedPressable style={[styles.extraBtn, { backgroundColor: colors.warningBg, borderWidth: 1, borderColor: colors.warningBorder }]} onPress={() => handleAction(0, false, 'wide')}>
                <Text style={[styles.extraBtnText, { color: colors.warning }]}>WIDE</Text>
                <Text style={{ color: colors.warning, fontSize: 9, fontWeight: '700' }}>+1 RUN</Text>
              </AnimatedPressable>
              <AnimatedPressable style={[styles.extraBtn, { backgroundColor: colors.warningBg, borderWidth: 1, borderColor: colors.warningBorder }]} onPress={() => handleAction(0, false, 'noball')}>
                <Text style={[styles.extraBtnText, { color: colors.warning }]}>NO BALL</Text>
                <Text style={{ color: colors.warning, fontSize: 9, fontWeight: '700' }}>+1 RUN</Text>
              </AnimatedPressable>
              <AnimatedPressable style={[styles.extraBtn, { backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder }]} onPress={() => handleAction(0, true)}>
                <Text style={[styles.extraBtnText, { color: colors.error }]}>WICKET</Text>
                <Text style={{ color: colors.error, fontSize: 9, fontWeight: '700' }}>OUT!</Text>
              </AnimatedPressable>
            </View>

            {/* Undo */}
            <AnimatedPressable
              style={[styles.undoBtn, { borderColor: colors.border }]}
              onPress={async () => {
                const ballsList = (match.balls ?? []).filter((b: any) => b.inning_number === currentInning).sort((a: any, b: any) => a.id - b.id);
                if (!ballsList.length) { Alert.alert('No balls to undo in this inning.'); return; }
                const last = ballsList[ballsList.length - 1];
                const { error: deleteErr } = await supabase.from('balls').delete().eq('id', last.id);
                if (deleteErr) { Alert.alert('Undo Failed', 'Permission denied. Make sure you have added the DELETE policy in Supabase.'); return; }

                const sub = isTeamABat
                  ? { team_a_score: Math.max(0, batScore - last.runs - last.extra_runs), team_a_wickets: Math.max(0, batWkts - (last.wicket ? 1 : 0)), status: 'in_progress' }
                  : { team_b_score: Math.max(0, batScore - last.runs - last.extra_runs), team_b_wickets: Math.max(0, batWkts - (last.wicket ? 1 : 0)), status: 'in_progress' };
                await supabase.from('matches').update(sub).eq('id', mid);

                const restoredStriker = last.batter_name;
                const restoredBowler = last.bowler_name;
                const prevBalls = ballsList.slice(0, -1);
                const batterStatus = new Map<string, boolean>();
                prevBalls.forEach((b: any) => { if (!batterStatus.has(b.batter_name)) batterStatus.set(b.batter_name, false); if (b.wicket) batterStatus.set(b.batter_name, true); });
                let restoredNonStriker = '';
                for (const [name, isOut] of batterStatus.entries()) { if (!isOut && name !== restoredStriker) { restoredNonStriker = name; break; } }
                if (!restoredNonStriker) { if (striker && striker !== restoredStriker) restoredNonStriker = striker; else if (nonStriker && nonStriker !== restoredStriker) restoredNonStriker = nonStriker; }

                setStriker(restoredStriker); setNonStriker(restoredNonStriker); setBowler(restoredBowler);
                setAwaitingBatter(false); setAwaitingBowler(false); setNameModal(null); setNewName('');
                const { data } = await supabase.from('matches').select('*, balls(*)').eq('id', mid).single();
                if (data) setMatch(data);
              }}
            >
              <Text style={{ color: colors.subText, fontWeight: '700', fontSize: 13 }}>↩ Undo Last Ball</Text>
            </AnimatedPressable>
          </>
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  screenHeader: { fontSize: 18, fontWeight: '800', marginBottom: 14, letterSpacing: -0.3 },
  scoreboard: { borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 14 },
  sbScore: { fontSize: 72, fontWeight: '900', letterSpacing: -2 },
  targetRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  targetChip: { color: '#ffffff', fontWeight: '700', fontSize: 12, backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  ballRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 14 },
  ballDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  noticeBar: { borderWidth: 1, borderRadius: 6, padding: 12, marginBottom: 14 },
  panel: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  panelTitle: { fontWeight: '800', fontSize: 15, marginBottom: 12 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fieldBox: { flex: 1, borderWidth: 1.5, borderRadius: 6, padding: 10 },
  fieldInput: { fontSize: 14, fontWeight: '700' },
  swapBtn: { width: 36, height: 36, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  runRow: { flexDirection: 'row', gap: 10 },
  runBtn: { flex: 1, paddingVertical: 18, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  runBtnNum: { fontSize: 28, fontWeight: '900' },
  extraRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  extraBtn: { flex: 1, paddingVertical: 14, borderRadius: 6, alignItems: 'center' },
  extraBtnText: { fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  undoBtn: { borderWidth: 1, borderRadius: 6, padding: 14, alignItems: 'center', marginBottom: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24, borderTopWidth: 1 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, letterSpacing: -0.3 },
  inputLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 },
  modalInput: { borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, marginBottom: 16 },
  primaryBtn: { borderRadius: 6, paddingVertical: 11, paddingHorizontal: 20, alignItems: 'center' },
  primaryBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
});
