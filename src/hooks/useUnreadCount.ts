// src/hooks/useUnreadCount.ts
// Returns live unread message + pending request counts for the logged-in user.
import { useEffect, useState } from 'react';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/context/AuthContext';

export interface UnreadCounts {
  messages: number;   // unread chat messages in accepted channels
  requests: number;   // pending incoming chat requests
  total: number;      // combined badge number
}

export function useUnreadCount(): UnreadCounts {
  const { session } = useAuth();
  const myId = session?.user?.id;

  const [messages, setMessages] = useState(0);
  const [requests, setRequests] = useState(0);

  const fetchCounts = async () => {
    if (!myId) return;

    // 1. Count pending incoming requests (channels where I am the receiver)
    const { count: reqCount } = await supabase
      .from('chat_channels')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', myId)
      .eq('status', 'pending');

    setRequests(reqCount ?? 0);

    // 2. Count unread messages across all accepted channels I belong to
    //    We track "unread" as messages NOT sent by me in accepted channels.
    //    This is a simple heuristic — a proper system would need a read_at column.
    const { data: myChannels } = await supabase
      .from('chat_channels')
      .select('id')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .eq('status', 'accepted');

    if (!myChannels || myChannels.length === 0) {
      setMessages(0);
      return;
    }

    const channelIds = myChannels.map((c: any) => c.id);

    // Count unread messages (is_read = false) not sent by me
    const { count: msgCount, error: msgErr } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .in('channel_id', channelIds)
      .neq('sender_id', myId)
      .eq('is_read', false);

    if (msgErr) console.error('Error fetching unread messages:', msgErr);

    setMessages(msgCount ?? 0);
  };

  useEffect(() => {
    if (!myId) return;

    fetchCounts();

    // Create unique channel names for this mount to avoid strict mode reuse errors
    const sessionId = Math.random().toString(36).substring(7);
    
    // Subscribe to new messages or read status updates in real-time
    const msgSub = supabase
      .channel(`unread_messages_${myId}_${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
      }, () => {
        fetchCounts();
      })
      .subscribe();

    // Subscribe to new/updated chat channels (pending requests)
    const chanSub = supabase
      .channel(`unread_requests_${myId}_${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_channels',
      }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgSub);
      supabase.removeChannel(chanSub);
    };
  }, [myId]);

  return { messages, requests, total: messages + requests };
}
