// File: app/(admin)/financial-dashboard.tsx
// Req #10 Bonus: Stripe payment + real transaction history from Supabase
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Animated, Alert,
} from 'react-native';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { CheckoutModal } from '@/src/components/CheckoutModal';
import { supabase } from '@/src/services/supabase';
import { SkeletonLoader } from '@/src/components/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

const MATCH_FEE = 500; // Rs. 500 per player

function formatAmount(amount: number): string {
  return `Rs. ${(amount / 100).toLocaleString()}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PK', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function statusColor(status: string, colors: any): string {
  if (status === 'succeeded') return colors.success;
  if (status === 'pending') return colors.warning;
  return colors.error;
}

export default function FinancialDashboardScreen() {
  const { colors } = useTheme();
  const { session, role } = useAuth();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPaid, setTotalPaid] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const fetchPayments = useCallback(async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('id, amount, currency, status, stripe_payment_intent_id, created_at')
      .eq('user_id', session?.user?.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPayments(data);
      const total = data
        .filter((p) => p.status === 'succeeded')
        .reduce((sum, p) => sum + p.amount, 0);
      setTotalPaid(total);
    }
  }, [session?.user?.id]);

  const load = async () => {
    setLoading(true);
    await fetchPayments();
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayments();
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const isCaptain = role === 'CAPTAIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {/* Header */}
          <Text style={[styles.pageTitle, { color: colors.text }]}>💰 Financial</Text>
          <Text style={[styles.subtitle, { color: colors.subText }]}>Your payment history & transactions</Text>

          {/* Summary Cards */}
          <View style={styles.cardsRow}>
            <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>TOTAL PAID</Text>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {loading ? '...' : formatAmount(totalPaid)}
              </Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.metricLabel, { color: colors.muted }]}>TRANSACTIONS</Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {loading ? '...' : payments.length}
              </Text>
            </View>
          </View>

          {/* Pay Match Fee Card */}
          {(isCaptain || !isSuperAdmin) && (
            <View style={[styles.payCard, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.payTitle, { color: colors.primary }]}>🏏 Match Registration Fee</Text>
                <Text style={[styles.payDesc, { color: colors.subText }]}>
                  Pay Rs. {MATCH_FEE} to register for a match. Secure payment via Stripe.
                </Text>
                <Text style={[styles.testCard, { color: colors.muted }]}>
                  Test card: 4242 4242 4242 4242 | 12/34 | 123
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.payBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowCheckout(!showCheckout)}
              >
                <Ionicons name={showCheckout ? 'chevron-up' : 'card-outline'} size={16} color="#fff" />
                <Text style={styles.payBtnText}>{showCheckout ? 'Hide' : 'Pay Now'}</Text>
              </TouchableOpacity>

              {showCheckout && (
                <View style={{ marginTop: 16, width: '100%' }}>
                  <CheckoutModal
                    amountPKR={MATCH_FEE}
                    onSuccess={() => {
                      setShowCheckout(false);
                      onRefresh();
                      Alert.alert('✅ Payment Successful', 'Your match registration fee has been received and logged.');
                    }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Transaction History */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaction History</Text>

          {loading ? (
            // Skeleton loading state
            [1, 2, 3].map((i) => (
              <View key={i} style={[styles.txRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <SkeletonLoader width="60%" height={14} style={{ marginBottom: 6 }} />
                <SkeletonLoader width="40%" height={12} />
              </View>
            ))
          ) : payments.length === 0 ? (
            // Empty state
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>💳</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions Yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.subText }]}>
                Your payment history will appear here after your first transaction.
              </Text>
            </View>
          ) : (
            payments.map((p) => (
              <View key={p.id} style={[styles.txRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.txLeft}>
                  <View style={[styles.txIconBg, { backgroundColor: statusColor(p.status, colors) + '22' }]}>
                    <Ionicons
                      name={p.status === 'succeeded' ? 'checkmark-circle' : p.status === 'pending' ? 'time' : 'close-circle'}
                      size={18}
                      color={statusColor(p.status, colors)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.txTitle, { color: colors.text }]}>Match Registration Fee</Text>
                    <Text style={[styles.txDate, { color: colors.muted }]}>{formatDate(p.created_at)}</Text>
                    {p.stripe_payment_intent_id && (
                      <Text style={[styles.txId, { color: colors.muted }]} numberOfLines={1}>
                        ID: {p.stripe_payment_intent_id.slice(0, 24)}…
                      </Text>
                    )}
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txAmount, { color: colors.text }]}>{formatAmount(p.amount)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(p.status, colors) + '22' }]}>
                    <Text style={[styles.statusText, { color: statusColor(p.status, colors) }]}>
                      {p.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 20 },

  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  metricCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1 },
  metricLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  metricValue: { fontSize: 22, fontWeight: '900' },

  payCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 24, alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  payTitle: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  payDesc: { fontSize: 12, lineHeight: 18 },
  testCard: { fontSize: 10, marginTop: 8, fontFamily: 'monospace' },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  payBtnText: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

  sectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },

  txRow: {
    borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  txIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  txTitle: { fontSize: 13, fontWeight: '700' },
  txDate: { fontSize: 11, marginTop: 2 },
  txId: { fontSize: 10, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: '900', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  emptyDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
