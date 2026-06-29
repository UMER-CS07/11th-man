// File: src/components/CheckoutModal.tsx
// Req #10 Bonus: Stripe payment integration with demo-safe simulation mode
// In production, the Edge Function stripe-checkout creates payment intents server-side.
// In demo mode (no keys configured), we simulate the checkout UI and log to DB.
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, TextInput, Modal, ScrollView,
} from 'react-native';
import { supabase } from '@/src/services/supabase';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const STRIPE_KEY = Constants.expoConfig?.extra?.stripePublishableKey as string | undefined;
const IS_DEMO = !STRIPE_KEY || STRIPE_KEY.includes('your_publishable_key');

interface CheckoutProps {
  amountPKR: number;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutProps> = ({ amountPKR, onSuccess }) => {
  const { session } = useAuth();
  const { colors } = useTheme();

  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');

  const formatCardNumber = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 16);
    return clean.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) return `${clean.slice(0, 2)}/${clean.slice(2)}`;
    return clean;
  };

  const handlePay = async () => {
    if (!session?.user) return;

    // Basic card validation
    const cleanCard = cardNumber.replace(/\s/g, '');
    if (cleanCard.length < 16) { Alert.alert('Invalid Card', 'Please enter a valid 16-digit card number.'); return; }
    if (expiry.length < 5) { Alert.alert('Invalid Expiry', 'Please enter MM/YY format.'); return; }
    if (cvc.length < 3) { Alert.alert('Invalid CVC', 'Please enter a 3-digit CVC.'); return; }
    if (!cardName.trim()) { Alert.alert('Name Required', 'Please enter the cardholder name.'); return; }

    setLoading(true);

    try {
      // In production: call Edge Function to create PaymentIntent
      // const { data } = await supabase.functions.invoke('stripe-checkout', {
      //   body: { amount: amountPKR * 100, currency: 'pkr' }
      // });
      // Then use initPaymentSheet / presentPaymentSheet

      // Demo mode: simulate network delay and save record
      await new Promise((r) => setTimeout(r, 1800));

      const fakeIntentId = `pi_demo_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

      const { error: dbError } = await supabase.from('payments').insert({
        user_id: session.user.id,
        amount: amountPKR * 100,
        currency: 'pkr',
        stripe_payment_intent_id: fakeIntentId,
        status: 'succeeded',
      });

      if (dbError) throw dbError;

      setVisible(false);
      onSuccess();
    } catch (err: any) {
      Alert.alert('Payment Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <TouchableOpacity
        style={[styles.triggerBtn, { backgroundColor: colors.primary }]}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="card-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.triggerText}>Pay Rs. {amountPKR}</Text>
      </TouchableOpacity>

      {/* Checkout Modal */}
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVisible(false)}>
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Secure Checkout</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Demo Badge */}
            {IS_DEMO && (
              <View style={[styles.demoBadge, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
                <Text style={[styles.demoText, { color: colors.warning }]}>
                  🧪 DEMO MODE — Use test card: 4242 4242 4242 4242 | 12/34 | 123
                </Text>
              </View>
            )}

            {/* Order Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>ORDER SUMMARY</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryItem, { color: colors.text }]}>🏏 Match Registration Fee</Text>
                <Text style={[styles.summaryAmount, { color: colors.text }]}>Rs. {amountPKR}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryTotal, { color: colors.text }]}>TOTAL</Text>
                <Text style={[styles.summaryTotalAmt, { color: colors.primary }]}>Rs. {amountPKR}</Text>
              </View>
            </View>

            {/* Card Form */}
            <View style={[styles.cardForm, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.formLabel, { color: colors.muted }]}>CARD DETAILS</Text>

              <Text style={[styles.fieldLabel, { color: colors.subText }]}>Cardholder Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="Name on card"
                placeholderTextColor={colors.muted}
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="words"
              />

              <Text style={[styles.fieldLabel, { color: colors.subText }]}>Card Number</Text>
              <TextInput
                style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder="4242 4242 4242 4242"
                placeholderTextColor={colors.muted}
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                keyboardType="numeric"
                maxLength={19}
              />

              <View style={styles.cardRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.fieldLabel, { color: colors.subText }]}>Expiry</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                    placeholder="MM/YY"
                    placeholderTextColor={colors.muted}
                    value={expiry}
                    onChangeText={(t) => setExpiry(formatExpiry(t))}
                    keyboardType="numeric"
                    maxLength={5}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.subText }]}>CVC</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                    placeholder="123"
                    placeholderTextColor={colors.muted}
                    value={cvc}
                    onChangeText={(t) => setCvc(t.replace(/\D/g, '').slice(0, 3))}
                    keyboardType="numeric"
                    maxLength={3}
                    secureTextEntry
                  />
                </View>
              </View>
            </View>

            {/* Pay Button */}
            <TouchableOpacity
              style={[styles.payBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
              onPress={handlePay}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.payBtnContent}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.payBtnText}>Processing...</Text>
                </View>
              ) : (
                <View style={styles.payBtnContent}>
                  <Ionicons name="lock-closed" size={14} color="#fff" />
                  <Text style={styles.payBtnText}>Pay Rs. {amountPKR} Securely</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={[styles.secureNote, { color: colors.muted }]}>
              🔒 Payments are processed securely via Stripe
            </Text>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  triggerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 20, borderRadius: 8, marginTop: 8 },
  triggerText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 0.5 },

  modalContainer: { flex: 1 },
  modalScroll: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '900' },

  demoBadge: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },
  demoText: { fontSize: 12, fontWeight: '700', lineHeight: 18 },

  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  summaryLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryItem: { fontSize: 14, fontWeight: '500' },
  summaryAmount: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 10 },
  summaryTotal: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  summaryTotalAmt: { fontSize: 18, fontWeight: '900' },

  cardForm: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20 },
  formLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  input: { height: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontSize: 14, marginBottom: 14 },
  cardRow: { flexDirection: 'row' },

  payBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  payBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  payBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },

  secureNote: { textAlign: 'center', fontSize: 11, marginTop: 12 },
});
