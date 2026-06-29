import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';

interface CheckoutProps {
  amountPKR: number;
  onSuccess: () => void;
}

export const CheckoutModal: React.FC<CheckoutProps> = ({ amountPKR, onSuccess }) => {
  const { colors } = useTheme();

  const handleWebPayment = () => {
    // Stripe React Native doesn't support web by default without additional setup.
    // For now, simulate success on web.
    Alert.alert('Web Payment', `Simulating payment of Rs. ${amountPKR} for web...`, [
      { text: 'Complete', onPress: onSuccess }
    ]);
  };

  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: colors.primary }]} 
      onPress={handleWebPayment}
    >
      <Text style={styles.btnText}>Pay Rs. {amountPKR} (Web Simulation)</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: { paddingVertical: 11, paddingHorizontal: 20, borderRadius: 6, alignItems: 'center', marginTop: 16 },
  btnText: { color: '#ffffff', fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }
});
