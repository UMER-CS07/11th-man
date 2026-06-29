// File: app/(user)/settings.tsx
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/context/AuthContext';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

export default function SettingsScreen() {
  const { colors, mode, setThemeMode } = useTheme();
  const { signOut } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionGroupLabel, { color: colors.muted }]}>APPEARANCE</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          
          <View style={styles.settingRow}>
            <Text style={[styles.rowText, { color: colors.text }]}>Display Theme</Text>
            <AnimatedPressable
              style={[styles.themeToggle, { borderColor: colors.primaryBorder, backgroundColor: colors.primaryBg }]}
              onPress={() => setThemeMode(mode === 'dark' ? 'light' : 'dark')}
            >
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                {mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </Text>
            </AnimatedPressable>
          </View>
        </View>

        <AnimatedPressable style={[styles.logoutBtn, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]} onPress={signOut}>
          <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
        </AnimatedPressable>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 },
  section: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  sectionGroupLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 },
  dividerLine: { height: 1, marginBottom: 14 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowText: { fontSize: 14, fontWeight: '500' },
  themeToggle: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6 },
  logoutBtn: { paddingVertical: 14, borderRadius: 6, alignItems: 'center', borderWidth: 1 },
  logoutText: { fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }
});
