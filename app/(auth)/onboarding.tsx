import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useTheme } from '@/src/context/ThemeContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

export default function OnboardingScreen() {
  const { colors } = useTheme();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        
        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <Text style={[styles.logoText, { color: colors.primary }]}>11th MAN</Text>
          <Text style={[styles.tagline, { color: colors.subText }]}>Find your squad. Score your matches.</Text>
        </View>

        <View style={[styles.illustration, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]} />

        <View style={styles.dotsContainer}>
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
          <View style={[styles.dot, { backgroundColor: colors.border }]} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Welcome to the Future of Cricket</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>Find matches, join teams, and track your stats.</Text>
        
        <AnimatedPressable style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </AnimatedPressable>
        
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  brandContainer: { alignItems: 'center', marginBottom: 40 },
  logoText: { fontSize: 28, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  tagline: { fontSize: 13, marginTop: 8, textAlign: 'center' },
  illustration: { width: '100%', height: 200, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 40 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3, marginBottom: 16, textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 48, textAlign: 'center' },
  primaryButton: { width: '100%', borderRadius: 6, paddingVertical: 11, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' }
});
