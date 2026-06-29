import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, RefreshControl, TouchableOpacity,
  Alert, ActivityIndicator, Animated,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { SkeletonLoader } from '@/src/components/SkeletonLoader';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useUnreadCount } from '@/src/hooks/useUnreadCount';

interface Requirement {
  id: string;
  mode: string;
  role_needed: string;
  venue: string;
  match_date: string;
  notes: string | null;
  user_id: string | null;
}

interface Match {
  id: string;
  team_a: string;
  team_b: string;
  team_a_score: number;
  team_b_score: number;
  team_a_wickets: number;
  team_b_wickets: number;
  total_overs: number;
  toss_winner: string;
  elected_to: string;
  status: string;
  scorer_id: string;
}

type TabType = 'marketplace' | 'matches';

export default function DiscoverFeed() {
  const { colors } = useTheme();
  const { role, session, roleLoaded } = useAuth();
  const router = useRouter();
  const { total: unreadTotal, requests: pendingRequests } = useUnreadCount();

  // Screen mount fade-in
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const fabFade = useRef(new Animated.Value(0)).current;
  const fabY = useRef(new Animated.Value(40)).current;

  // Speed dial state
  const [fabOpen, setFabOpen] = useState(false);
  const fabRotate = useRef(new Animated.Value(0)).current;
  const dial1Anim = useRef(new Animated.Value(0)).current; // 0=hidden 1=shown
  const dial2Anim = useRef(new Animated.Value(0)).current;

  const openDial = () => {
    setFabOpen(true);
    Animated.parallel([
      Animated.spring(fabRotate, { toValue: 1, useNativeDriver: true }),
      Animated.timing(dial1Anim, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.timing(dial2Anim, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const closeDial = (cb?: () => void) => {
    Animated.parallel([
      Animated.spring(fabRotate, { toValue: 0, useNativeDriver: true }),
      Animated.timing(dial2Anim, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(dial1Anim, { toValue: 0, duration: 130, useNativeDriver: true }),
    ]).start(() => { setFabOpen(false); cb?.(); });
  };

  const toggleDial = () => fabOpen ? closeDial() : openDial();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 280, useNativeDriver: true,
    }).start();
    Animated.parallel([
      Animated.timing(fabFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(fabY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, fabFade, fabY]);

  const [activeTab, setActiveTab] = useState<TabType>('marketplace');
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [appliedUserIds, setAppliedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reqPage, setReqPage] = useState(0);
  const [matchPage, setMatchPage] = useState(0);
  const [reqHasMore, setReqHasMore] = useState(true);
  const [matchHasMore, setMatchHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 15;

  const isCaptain = roleLoaded && role === 'CAPTAIN';
  const isSuperAdmin = roleLoaded && role === 'SUPER_ADMIN';
  const isAdmin = isCaptain;
  const isPlayer = roleLoaded && role === 'PLAYER';

  const fetchRequirements = async (pageIndex = 0, isRefresh = false) => {
    if (!isRefresh && !reqHasMore) return;
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('requirements')
      .select('id, mode, role_needed, venue, match_date, notes, user_id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      if (isRefresh) {
        setRequirements(data);
      } else {
        setRequirements(prev => {
          const newItems = data.filter(d => !prev.some(p => p.id === d.id));
          return [...prev, ...newItems];
        });
      }
      setReqHasMore(data.length === PAGE_SIZE);
      setReqPage(pageIndex);
    }
  };

  const fetchMatches = async (pageIndex = 0, isRefresh = false) => {
    if (!isRefresh && !matchHasMore) return;
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('matches')
      .select('id, team_a, team_b, team_a_score, team_b_score, team_a_wickets, team_b_wickets, total_overs, toss_winner, elected_to, status, scorer_id')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      if (isRefresh) {
        setMatches(data);
      } else {
        setMatches(prev => {
          const newItems = data.filter(d => !prev.some(p => p.id === d.id));
          return [...prev, ...newItems];
        });
      }
      setMatchHasMore(data.length === PAGE_SIZE);
      setMatchPage(pageIndex);
    }
  };

  const fetchAppliedUserIds = async () => {
    const myId = session?.user?.id;
    if (!myId) return;
    const { data, error } = await supabase
      .from('chat_channels')
      .select('receiver_id')
      .eq('sender_id', myId);
    if (!error && data) {
      setAppliedUserIds(data.map((c: any) => c.receiver_id));
    }
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchRequirements(0, true),
      fetchMatches(0, true),
      fetchAppliedUserIds()
    ]);
    setLoading(false);
    setRefreshing(false);
  }, [session?.user?.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, [loadAll]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    if (activeTab === 'marketplace' && reqHasMore) {
      await fetchRequirements(reqPage + 1, false);
    } else if (activeTab === 'matches' && matchHasMore) {
      await fetchMatches(matchPage + 1, false);
    }
    setLoadingMore(false);
  };

  const handleApply = (req: Requirement) => {
    if (!req.user_id) {
      Alert.alert('Error', 'Cannot apply. This requirement has no associated user.');
      return;
    }
    Alert.alert(
      'Apply for Slot',
      `You are applying for:\n\nRole: ${req.role_needed}\nVenue: ${req.venue}\nDate: ${new Date(req.match_date).toLocaleDateString()}\n\nThe team admin will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Apply',
          onPress: async () => {
            try {
              const myId = session?.user?.id;
              if (!myId) return;

              const { data: channels, error: fetchErr } = await supabase
                .from('chat_channels')
                .select('id, status, sender_id, receiver_id')
                .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`);

              if (fetchErr) throw fetchErr;

              const existing = channels?.find(c =>
                (c.sender_id === myId && c.receiver_id === req.user_id) ||
                (c.sender_id === req.user_id && c.receiver_id === myId)
              );

              let channelId = existing?.id;

              if (!channelId) {
                const { data: newChan, error: insertErr } = await supabase.from('chat_channels').insert({
                  sender_id: myId,
                  receiver_id: req.user_id,
                  status: 'pending'
                }).select('id').single();
                if (insertErr) throw insertErr;
                channelId = newChan.id;
              } else if (existing?.status === 'rejected') {
                await supabase.from('chat_channels').update({ status: 'pending' }).eq('id', channelId);
              }

              const message = req.mode === 'solo'
                ? `Hey Captain! I saw your requirement for a "${req.role_needed}" and I'd love to play.`
                : `Hey! Our team is interested in your team challenge. We're ready to play!`;

              const { error: msgErr } = await supabase.from('chat_messages').insert({
                channel_id: channelId,
                sender_id: myId,
                content: message,
              });

              if (msgErr) throw msgErr;

              await fetchAppliedUserIds();

              Alert.alert('Applied!', 'Your application message has been sent to the captain. Check your messages to continue chatting.');
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'in_progress' || status === 'live') return colors.success;
    if (status === 'completed') return colors.subText;
    if (status === 'innings_break') return colors.warning;
    return colors.primary;
  };

  const handleDeleteRequirement = (reqId: string) => {
    Alert.alert(
      'Delete Requirement',
      'Are you sure you want to remove this requirement from the marketplace?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('requirements')
              .delete()
              .eq('id', reqId)
              .eq('user_id', session?.user?.id);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setRequirements(prev => prev.filter(r => r.id !== reqId));
              Alert.alert('Deleted', 'Requirement removed from the marketplace.');
            }
          },
        },
      ]
    );
  };

  const renderRequirementItem = ({ item }: { item: Requirement }) => {
    const isMine = item.user_id === session?.user?.id;
    const alreadyApplied = appliedUserIds.includes(item.user_id || '');
    const roleMatch = (isPlayer && item.mode === 'solo') || (isSuperAdmin && item.mode === 'team');
    const canApply = !isMine && roleMatch && !alreadyApplied;

    const modeBadgeBg = item.mode === 'solo' ? colors.skyBg : colors.violetBg;
    const modeBadgeBorder = item.mode === 'solo' ? colors.skyBorder : colors.violetBorder;
    const modeBadgeText = item.mode === 'solo' ? colors.sky : colors.violet;

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* 2px primary top-bar accent strip */}
        <View style={[styles.cardAccentBar, { backgroundColor: colors.primary }]} />

        <View style={styles.cardHeader}>
          <View style={[styles.modeBadge, { backgroundColor: modeBadgeBg, borderWidth: 1, borderColor: modeBadgeBorder }]}>
            <Text style={[styles.modeText, { color: modeBadgeText }]}>{item.mode?.toUpperCase()}</Text>
          </View>
          {canApply && (
            <AnimatedPressable
              style={[styles.applyBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleApply(item)}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </AnimatedPressable>
          )}
          {isMine && (
            <AnimatedPressable
              style={[styles.applyBtn, { backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder }]}
              onPress={() => handleDeleteRequirement(item.id)}
            >
              <Text style={[styles.applyBtnText, { color: colors.error }]}>🗑 Delete</Text>
            </AnimatedPressable>
          )}
        </View>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{item.role_needed}</Text>
        <Text style={[styles.cardSub, { color: colors.subText }]}>📍 {item.venue}</Text>
        <Text style={[styles.cardSub, { color: colors.subText }]}>
          📅 {new Date(item.match_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
        {item.notes ? <Text style={[styles.cardNotes, { color: colors.muted }]}>💬 {item.notes}</Text> : null}
      </View>
    );
  };

  const renderMatchItem = ({ item }: { item: Match }) => {
    const isLive = item.status === 'in_progress' || item.status === 'live';
    const isMyMatch = item.scorer_id === session?.user?.id;

    return (
      <AnimatedPressable
        style={[styles.matchCard, { backgroundColor: colors.surface, borderColor: isLive ? colors.primary : colors.border }]}
        onPress={() => router.push({ pathname: '/(user)/scorecard', params: { matchId: item.id } })}
      >
        {/* 2px primary top-bar accent strip */}
        <View style={[styles.cardAccentBar, { backgroundColor: isLive ? colors.success : colors.primary }]} />

        <View style={styles.matchHeader}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status?.replace(/_/g, ' ').toUpperCase()}
          </Text>
          {isMyMatch && isCaptain && (
            <View style={[styles.myMatchPill, { backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder }]}>
              <Text style={[styles.myMatchBadge, { color: colors.primary }]}>MY MATCH</Text>
            </View>
          )}
        </View>

        <View style={styles.teamsRow}>
          <View style={styles.teamBlock}>
            <Text style={[styles.teamName, { color: colors.text }]}>{item.team_a}</Text>
            <Text style={[styles.teamScore, { color: colors.text }]}>
              {item.team_a_score}/{item.team_a_wickets}
            </Text>
          </View>
          <Text style={[styles.vsText, { color: colors.muted }]}>VS</Text>
          <View style={[styles.teamBlock, { alignItems: 'flex-end' }]}>
            <Text style={[styles.teamName, { color: colors.text }]}>{item.team_b}</Text>
            <Text style={[styles.teamScore, { color: colors.text }]}>
              {item.team_b_score}/{item.team_b_wickets}
            </Text>
          </View>
        </View>

        <Text style={[styles.oversText, { color: colors.subText }]}>
          {item.total_overs} Overs · Tap to view scorecard
        </Text>

        {isMyMatch && isCaptain && isLive && (
          <AnimatedPressable
            style={[styles.scoreBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push({ pathname: '/(user)/scorer', params: { matchId: item.id } })}
          >
            <Text style={styles.scoreBtnText}>▶ Continue Scoring</Text>
          </AnimatedPressable>
        )}
      </AnimatedPressable>
    );
  };

  const renderSkeleton = () => (
    <View style={{ padding: 16 }}>
      {[1, 2, 3].map((k) => (
        <View key={k} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, marginBottom: 12 }]}>
          <SkeletonLoader width="50%" height={18} style={{ marginBottom: 10 }} />
          <SkeletonLoader width="80%" height={14} style={{ marginBottom: 8 }} />
          <SkeletonLoader width="60%" height={14} />
        </View>
      ))}
    </View>
  );

  const currentData = activeTab === 'marketplace' ? requirements : matches;

  return (
    <SafeAreaWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>11TH MAN</Text>
          <View style={styles.headerBadge}>
            {roleLoaded ? (
              <View style={[styles.headerRolePill, {
                backgroundColor: isAdmin ? colors.primaryBg : colors.surfaceRaised,
                borderWidth: 1,
                borderColor: isAdmin ? colors.primaryBorder : colors.border,
              }]}>
                <Text style={[styles.headerRole, { color: isAdmin ? colors.primary : colors.subText }]}>
                  {role}
                </Text>
              </View>
            ) : (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
          <View style={styles.headerRight}>
            {unreadTotal > 0 && (
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => router.push('/(user)/messages')}
              >
                <Ionicons name="chatbubbles-outline" size={22} color={colors.text} />
                <View style={[styles.headerBadgeBubble, { backgroundColor: colors.error }]}>
                  <Text style={styles.headerBadgeText}>{unreadTotal > 99 ? '99+' : unreadTotal}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'marketplace' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('marketplace')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'marketplace' ? colors.primary : colors.muted }]}>
              {isPlayer ? '🎯 FIND TEAM' : '📋 MARKET'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'matches' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab('matches')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'matches' ? colors.primary : colors.muted }]}>
              🏏 MATCHES
            </Text>
          </TouchableOpacity>
        </View>


        {loading ? renderSkeleton() : (
          <FlashList
            data={currentData as any[]}
            keyExtractor={(item) => item.id}
            renderItem={activeTab === 'marketplace' ? renderRequirementItem : renderMatchItem}
            contentContainerStyle={styles.list}
            estimatedItemSize={150}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
            }
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceRaised }]}>
                <Ionicons name="search-outline" size={40} color={colors.muted} style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
                  {activeTab === 'marketplace' ? 'No Open Slots' : 'No Matches Yet'}
                </Text>
                <Text style={{ color: colors.subText, fontSize: 13, textAlign: 'center' }}>
                  {activeTab === 'marketplace'
                    ? isCaptain
                      ? 'Post a requirement using the button below.'
                      : 'No open slots available right now. Check back soon!'
                    : isCaptain
                      ? 'Host a match from the button above!'
                      : 'No live or recent matches found.'}
                </Text>
              </View>
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 20 }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}

        {/* Speed Dial FAB — Captain only */}
        {isCaptain && (
          <>
            {/* Backdrop scrim */}
            {fabOpen && (
              <TouchableOpacity style={styles.fabScrim} activeOpacity={1} onPress={() => closeDial()} />
            )}

            {/* The whole dial lives in one absolutely-positioned container */}
            <Animated.View style={[styles.fabWrap, { opacity: fabFade, transform: [{ translateY: fabY }] }]}>

              {/* Dial item 2 — Post Req — fixed at bottom: 118 */}
              <Animated.View style={[
                styles.dialItem, { bottom: 118 },
                {
                  opacity: dial2Anim,
                  transform: [{ translateY: dial2Anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                },
              ]}>
                <Text style={[styles.dialLabel, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}>Post Req</Text>
                <TouchableOpacity
                  style={[styles.dialBtn, { backgroundColor: colors.violet }]}
                  onPress={() => closeDial(() => router.push('/(admin)/create-requirement'))}
                >
                  <Ionicons name="document-text-outline" size={18} color="#fff" />
                </TouchableOpacity>
              </Animated.View>

              {/* Dial item 1 — Start Match — fixed at bottom: 66 */}
              <Animated.View style={[
                styles.dialItem, { bottom: 66 },
                {
                  opacity: dial1Anim,
                  transform: [{ translateY: dial1Anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                },
              ]}>
                <Text style={[styles.dialLabel, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}>Start Match</Text>
                <TouchableOpacity
                  style={[styles.dialBtn, { backgroundColor: colors.primary }]}
                  onPress={() => closeDial(() => router.push('/(admin)/match-setup'))}
                >
                  <Ionicons name="play" size={18} color="#fff" />
                </TouchableOpacity>
              </Animated.View>

              {/* Main FAB */}
              <TouchableOpacity
                style={[styles.fabMain, { backgroundColor: colors.primary }]}
                onPress={toggleDial}
                activeOpacity={0.85}
              >
                <Animated.Text style={[
                  styles.fabMainIcon,
                  { transform: [{ rotate: fabRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] },
                ]}>+</Animated.Text>
              </TouchableOpacity>

            </Animated.View>
          </>
        )}

      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 15, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  headerBadge: { flex: 1, marginLeft: 10 },
  headerRolePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  headerRole: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerIconBtn: { position: 'relative', padding: 4 },
  headerBadgeBubble: {
    position: 'absolute', top: -2, right: -6,
    borderRadius: 4, minWidth: 18, height: 18, paddingHorizontal: 3,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  hostBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6 },
  hostBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  fabScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 },
  // fabWrap: fixed height to contain main FAB + 2 dial items above it
  // Main FAB: 52px. Each item: 42px + 12px gap = 54px. Total: 52 + 54 + 54 = 160px
  fabWrap: { position: 'absolute', bottom: 24, right: 20, width: 180, height: 200, zIndex: 20 },
  fabMain: {
    position: 'absolute', bottom: 0, right: 0,
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6,
  },
  fabMainIcon: { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 32, marginTop: -2 },
  dialItem: {
    position: 'absolute', right: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  dialBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 3 }, shadowRadius: 4,
  },
  dialLabel: {
    fontSize: 12, fontWeight: '700',
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 6, borderWidth: 1,
  },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' },
  infoBar: { paddingHorizontal: 16, paddingVertical: 10 },
  infoText: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  list: { padding: 16, paddingBottom: 100 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  cardAccentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 },
  modeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  modeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  applyBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  applyBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  cardSub: { fontSize: 13, marginBottom: 3 },
  cardNotes: { fontSize: 12, marginTop: 6, fontStyle: 'italic' },
  matchCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  matchHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', flex: 1 },
  myMatchPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  myMatchBadge: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  teamsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  teamBlock: { flex: 1 },
  teamName: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  teamScore: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  vsText: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginHorizontal: 8 },
  oversText: { fontSize: 11, marginTop: 4 },
  scoreBtn: { marginTop: 12, paddingVertical: 11, paddingHorizontal: 20, borderRadius: 6, alignItems: 'center' },
  scoreBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', margin: 16, padding: 32, borderRadius: 12 },

});
