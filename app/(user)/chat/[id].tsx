// File: app/(user)/chat/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/src/services/supabase';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function ChatScreen() {
  const { id, name } = useLocalSearchParams();
  const { colors } = useTheme();
  const { session } = useAuth();
  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const flatListRef = useRef<FlashList<any>>(null);

  useEffect(() => {
    fetchMessages();

    const subscription = supabase
      .channel(`chat_${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          if (payload.new.sender_id !== session?.user?.id) markAsRead();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [id]);

  const fetchMessages = async () => {
    const { data, error } = await supabase.from('chat_messages').select('*')
      .eq('channel_id', id).order('created_at', { ascending: true });
    if (!error && data) { setMessages(data); markAsRead(); }
  };

  const markAsRead = async () => {
    if (!session?.user?.id) return;
    await supabase.from('chat_messages').update({ is_read: true })
      .eq('channel_id', id).eq('is_read', false).neq('sender_id', session.user.id);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const { error } = await supabase.from('chat_messages').insert({
      channel_id: id, sender_id: session?.user?.id, content: inputText.trim(), is_read: false
    });
    if (!error) setInputText('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === session?.user?.id;
    return (
      <View style={[
        styles.messageBubble,
        isMe ? styles.myMessage : styles.theirMessage,
        { backgroundColor: isMe ? colors.primary : colors.surfaceRaised }
      ]}>
        <Text style={{ color: isMe ? '#ffffff' : colors.text, fontSize: 14, lineHeight: 20 }}>{item.content}</Text>
        <Text style={[styles.time, { color: isMe ? 'rgba(255,255,255,0.65)' : colors.muted }]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{name || 'Chat'}</Text>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlashList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={{ padding: 16, backgroundColor: colors.background }}
            estimatedItemSize={60}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          {/* Input bar */}
          <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <TextInput
              style={[styles.input, {
                color: colors.text,
                borderColor: inputFocused ? colors.primary : colors.border,
                backgroundColor: colors.background
              }]}
              placeholder="Type a message..."
              placeholderTextColor={colors.subText}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.primary }]}
              onPress={sendMessage}
            >
              <Ionicons name="send" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  backBtn: { marginRight: 12 },
  headerTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2, flex: 1 },
  messageBubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 10 },
  myMessage: { alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  theirMessage: { alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1.5, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginRight: 10 },
  sendBtn: { width: 40, height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
});
