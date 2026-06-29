// File: app/(user)/messages.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, TextInput, Image, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { SwipeableRow } from '@/src/components/SwipeableRow';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface ChatChannel {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  other_user?: { id: string; full_name: string; avatar_url: string; };
  lastMessage?: { content: string; created_at: string; sender_id: string; is_read: boolean; } | null;
  unreadCount?: number;
}

export default function MessagesScreen() {
  const { colors } = useTheme();
  const { session, role } = useAuth();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const [activeTab, setActiveTab] = useState<'chats' | 'requests' | 'search'>('chats');
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 15;

  const fetchChannels = useCallback(async (pageIndex = 0, isRefresh = false) => {
    if (!session?.user?.id || (!isRefresh && !hasMore)) return;
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('chat_channels')
      .select('*, sender:profiles!sender_id(id, full_name, avatar_url), receiver:profiles!receiver_id(id, full_name, avatar_url)')
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order('updated_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      const channelsWithDetails = await Promise.all(data.map(async (c: any) => {
        const otherUser = c.sender_id === session.user.id ? c.receiver : c.sender;
        if (c.status !== 'accepted') return { ...c, other_user: otherUser, lastMessage: null, unreadCount: 0 };

        const { data: msgData } = await supabase
          .from('chat_messages').select('content, created_at, sender_id, is_read')
          .eq('channel_id', c.id).order('created_at', { ascending: false }).limit(1);

        const { count: unreadCount } = await supabase
          .from('chat_messages').select('id', { count: 'exact', head: true })
          .eq('channel_id', c.id).eq('is_read', false).neq('sender_id', session.user.id);

        return { ...c, other_user: otherUser, lastMessage: msgData?.[0] || null, unreadCount: unreadCount || 0 };
      }));

      channelsWithDetails.sort((a, b) => {
        const timeA = a.lastMessage?.created_at || a.updated_at;
        const timeB = b.lastMessage?.created_at || b.updated_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      if (isRefresh) setChannels(channelsWithDetails);
      else setChannels(prev => { const newItems = channelsWithDetails.filter(d => !prev.some(p => p.id === d.id)); return [...prev, ...newItems]; });
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageIndex);
    }
  }, [session?.user?.id, hasMore]);

  const loadAll = async () => { setLoading(true); await fetchChannels(0, true); setLoading(false); setRefreshing(false); };
  useEffect(() => { loadAll(); }, [fetchChannels]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChannels(0, true).then(() => setRefreshing(false));
  }, [fetchChannels]);

  const loadMore = async () => {
    if (loadingMore || activeTab === 'search') return;
    setLoadingMore(true);
    await fetchChannels(page + 1, false);
    setLoadingMore(false);
  };

  const handleAction = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('chat_channels').update({ status: newStatus }).eq('id', id);
    if (error) { Alert.alert('Error', error.message); return; }

    if (newStatus === 'accepted' && role === 'CAPTAIN') {
      const { data: myReqs } = await supabase.from('requirements').select('id, role_needed')
        .eq('user_id', session?.user?.id).is('deleted_at', null).order('created_at', { ascending: false }).limit(1);

      if (myReqs && myReqs.length > 0) {
        const activeReq = myReqs[0];
        Alert.alert('Requirement Fulfilled?', `Does this user fulfill your open requirement for "${activeReq.role_needed}"?`, [
          { text: 'No', onPress: () => fetchChannels(), style: 'cancel' },
          { text: 'Yes, Close It', onPress: async () => {
            await supabase.from('requirements').update({ deleted_at: new Date().toISOString() }).eq('id', activeReq.id);
            Alert.alert('Success', 'Requirement marked as completed!');
            fetchChannels();
          }}
        ]);
        return;
      }
    }
    fetchChannels();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const q = searchQuery.trim();
    const { data, error } = await supabase.from('profiles').select('id, full_name, username, avatar_url, role')
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`).neq('id', session?.user?.id).limit(15);
    if (!error && data) setSearchResults(data);
    else if (error) Alert.alert('Search Error', error.message);
    setSearching(false);
  };

  const sendRequest = async (receiverId: string) => {
    const { error } = await supabase.from('chat_channels').insert({ sender_id: session?.user?.id, receiver_id: receiverId, status: 'pending' });
    if (error) Alert.alert('Notice', 'You have already connected with this user or a request is pending.');
    else { Alert.alert('Sent!', 'Chat request sent successfully.'); fetchChannels(); }
  };

  const activeChats = channels.filter(c => c.status === 'accepted');
  const pendingRequests = channels.filter(c => c.status === 'pending' && c.receiver_id === session?.user?.id);
  const handleDeleteChannel = async (channelId: string) => setChannels(prev => prev.filter(c => c.id !== channelId));

  const AvatarView = ({ user, size = 44 }: { user: any; size?: number }) => (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: 8, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder }]}>
      {user?.avatar_url
        ? <Image source={{ uri: user.avatar_url }} style={{ width: size, height: size, borderRadius: 6 }} />
        : <Text style={{ color: colors.primary, fontWeight: '900', fontSize: size * 0.38 }}>{user?.full_name?.charAt(0)?.toUpperCase()}</Text>}
    </View>
  );

  const renderChatItem = ({ item }: { item: ChatChannel }) => (
    <SwipeableRow onDelete={() => handleDeleteChannel(item.id)}>
      <AnimatedPressable
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push({ pathname: '/(user)/chat/[id]', params: { id: item.id, name: item.other_user?.full_name } })}
      >
        <View style={{ position: 'relative' }}>
          <AvatarView user={item.other_user} />
          {item.unreadCount ? <View style={[styles.presenceDot, { backgroundColor: colors.primary, top: -3, right: -3 }]} /> : null}
        </View>
        <View style={styles.info}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.other_user?.full_name}</Text>
            {item.lastMessage && (
              <Text style={{ color: item.unreadCount ? colors.primary : colors.muted, fontSize: 10, fontWeight: item.unreadCount ? '700' : '400' }}>
                {new Date(item.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: item.unreadCount ? colors.text : colors.subText, fontSize: 13, fontWeight: item.unreadCount ? '700' : '400', flex: 1 }} numberOfLines={1}>
              {item.lastMessage
                ? `${item.lastMessage.sender_id === session?.user?.id ? 'You: ' : ''}${item.lastMessage.content}`
                : 'Tap to start conversation'}
            </Text>
            {item.unreadCount ? (
              <View style={[styles.unreadBadge, { backgroundColor: colors.error }]}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </AnimatedPressable>
    </SwipeableRow>
  );

  const renderRequestItem = ({ item }: { item: ChatChannel }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AvatarView user={item.other_user} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.other_user?.full_name}</Text>
        <Text style={{ color: colors.subText, fontSize: 13 }}>Wants to chat / Apply</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => handleAction(item.id, 'accepted')}>
          <Ionicons name="checkmark" size={18} color="#ffffff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder, marginLeft: 8 }]} onPress={() => handleAction(item.id, 'rejected')}>
          <Ionicons name="close" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AvatarView user={item} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.full_name || 'Player'}</Text>
        <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
          {item.username ? `@${item.username}` : 'No username'}
          {item.role === 'SUPER_ADMIN' ? '  👑' : item.role === 'CAPTAIN' ? '  🏏' : ''}
        </Text>
      </View>
      <AnimatedPressable
        style={[styles.sendBtn, { backgroundColor: colors.primary }]}
        onPress={() => sendRequest(item.id)}
      >
        <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}>Request</Text>
      </AnimatedPressable>
    </View>
  );

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>MESSAGES</Text>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {(['chats', 'requests', 'search'] as const).map((tab) => {
            const labels = { chats: `CHATS (${activeChats.length})`, requests: `REQUESTS (${pendingRequests.length})`, search: 'FIND USERS' };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, { color: activeTab === tab ? colors.primary : colors.muted }]}>{labels[tab]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search input */}
        {activeTab === 'search' && (
          <View style={{ padding: 16, paddingBottom: 0, backgroundColor: colors.background }}>
            <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.muted} style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, color: colors.text, fontSize: 14 }}
                placeholder="Search by username or name..."
                placeholderTextColor={colors.subText}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={handleSearch} style={{ padding: 4 }}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : (
          <FlashList
            data={activeTab === 'chats' ? activeChats : activeTab === 'requests' ? pendingRequests : searchResults}
            keyExtractor={(item) => item.id}
            renderItem={activeTab === 'chats' ? renderChatItem : activeTab === 'requests' ? renderRequestItem : renderSearchItem}
            contentContainerStyle={{ padding: 16, backgroundColor: colors.background }}
            estimatedItemSize={80}
            refreshControl={activeTab !== 'search' ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} /> : undefined}
            ListEmptyComponent={
              <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceRaised }]}>
                <Ionicons name={activeTab === 'chats' ? 'chatbubbles-outline' : activeTab === 'requests' ? 'notifications-outline' : 'search-outline'} size={40} color={colors.muted} style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
                  {activeTab === 'chats' ? 'No Conversations' : activeTab === 'requests' ? 'No Pending Requests' : 'Find Players'}
                </Text>
                <Text style={{ color: colors.subText, fontSize: 13, textAlign: 'center' }}>
                  {searching
                    ? 'Searching...'
                    : activeTab === 'chats' ? 'No active conversations yet.' : activeTab === 'requests' ? 'No pending chat requests.' : 'Search for a user by their username (@babar_azam).'}
                </Text>
              </View>
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={loadingMore && activeTab !== 'search' ? <View style={{ paddingVertical: 20 }}><ActivityIndicator size="small" color={colors.primary} /></View> : null}
          />
        )}
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 15, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontWeight: '900', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  avatar: { alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  presenceDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  unreadBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4, marginLeft: 8, minWidth: 20, alignItems: 'center', justifyContent: 'center' },
  unreadBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  actions: { flexDirection: 'row' },
  actionBtn: { width: 34, height: 34, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1.5, borderRadius: 6, marginBottom: 8 },
  emptyContainer: { alignItems: 'center', padding: 32, borderRadius: 12, margin: 16 },
});
