// File: app/(user)/theme-showcase.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput,
  StyleSheet, Switch, ActivityIndicator, Animated
} from 'react-native';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';

export default function ThemeShowcase() {
  const { colors, isDark, toggleTheme } = useTheme();
  const [switchVal, setSwitchVal] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  const S = makeStyles(colors);

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.ScrollView style={{ flex: 1, opacity: fadeAnim }} contentContainerStyle={S.page} showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={S.headerSection}>
          <Text style={S.headerTitle}>🎨 THEME SHOWCASE</Text>
          <Text style={S.headerSub}>Every UI block used across the app</Text>
          <AnimatedPressable style={[S.btnPrimary, { marginTop: 16 }]} onPress={toggleTheme}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={16} color="#ffffff" />
            <Text style={S.btnPrimaryText}>  TOGGLE {isDark ? 'LIGHT' : 'DARK'} MODE</Text>
          </AnimatedPressable>
        </View>

        {/* ── COLOR TOKENS ── */}
        <Text style={S.groupLabel}>COLOR TOKENS</Text>
        <View style={S.card}>
          <View style={S.swatchRow}>
            <View style={[S.swatch, { backgroundColor: colors.primary }]}><Text style={S.swatchLabel}>primary</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primaryBorder }]}><Text style={[S.swatchLabel, { color: colors.primary }]}>pBg</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.surface }]}><Text style={[S.swatchLabel, { color: colors.text }]}>surface</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.surfaceRaised }]}><Text style={[S.swatchLabel, { color: colors.text }]}>raised</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.bg1 }]}><Text style={[S.swatchLabel, { color: colors.text }]}>bg1</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.background }]}><Text style={[S.swatchLabel, { color: colors.text }]}>bg</Text></View>
          </View>
          <View style={[S.swatchRow, { marginTop: 8 }]}>
            <View style={[S.swatch, { backgroundColor: colors.border }]}><Text style={[S.swatchLabel, { color: colors.text }]}>border</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.borderStrong }]}><Text style={[S.swatchLabel, { color: colors.text }]}>bStrong</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.text }]}><Text style={[S.swatchLabel, { color: colors.background }]}>text</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.subText }]}><Text style={[S.swatchLabel, { color: colors.background }]}>subText</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.muted }]}><Text style={[S.swatchLabel, { color: colors.background }]}>muted</Text></View>
          </View>
          <View style={[S.swatchRow, { marginTop: 8 }]}>
            <View style={[S.swatch, { backgroundColor: colors.success }]}><Text style={S.swatchLabel}>success</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.warning }]}><Text style={S.swatchLabel}>warning</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.error }]}><Text style={S.swatchLabel}>error</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.sky }]}><Text style={S.swatchLabel}>sky</Text></View>
            <View style={[S.swatch, { backgroundColor: colors.violet }]}><Text style={S.swatchLabel}>violet</Text></View>
          </View>
        </View>

        {/* ── TYPOGRAPHY ── */}
        <Text style={S.groupLabel}>TYPOGRAPHY SCALE</Text>
        <View style={S.card}>
          <Text style={[S.typoH1, { color: colors.text }]}>H1 (28px 900)</Text>
          <Text style={[S.typoH2, { color: colors.text }]}>H2 (20px 800)</Text>
          <Text style={[S.typoH3, { color: colors.text }]}>H3 (15px 700)</Text>
          <Text style={[S.typoBody, { color: colors.text }]}>Body (14px 400) — Regular text.</Text>
          <Text style={[S.typoSubText, { color: colors.subText }]}>subText (12px) — Meta information.</Text>
          <Text style={[S.typoMuted, { color: colors.muted }]}>muted (11px) — Secondary details.</Text>
          <Text style={[S.typoLabel, { color: colors.muted }]}>LABEL (9PX 900 2LS)</Text>
          <Text style={[S.typoCaption, { color: colors.primary }]}>Caption / Link</Text>
        </View>

        {/* ── BUTTONS ── */}
        <Text style={S.groupLabel}>BUTTONS</Text>
        <View style={S.card}>
          <AnimatedPressable style={S.btnPrimary}>
            <Text style={S.btnPrimaryText}>PRIMARY BUTTON</Text>
          </AnimatedPressable>

          <AnimatedPressable style={[S.btnOutline, { borderColor: colors.primary }]}>
            <Text style={[S.btnOutlineText, { color: colors.primary }]}>OUTLINE BUTTON</Text>
          </AnimatedPressable>

          <AnimatedPressable style={[S.btnPrimary, { backgroundColor: colors.error }]}>
            <Text style={S.btnPrimaryText}>DANGER BUTTON</Text>
          </AnimatedPressable>

          <AnimatedPressable style={S.btnGhost}>
            <Text style={[S.btnGhostText, { color: colors.subText }]}>GHOST BUTTON</Text>
          </AnimatedPressable>

          <View style={[S.btnPrimary, { opacity: 0.7, flexDirection: 'row', gap: 8 }]}>
            <ActivityIndicator color="#ffffff" size="small" />
            <Text style={S.btnPrimaryText}>LOADING...</Text>
          </View>

          <View style={S.rowCentered}>
            <AnimatedPressable style={[S.fab, { backgroundColor: colors.primary }]}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </AnimatedPressable>
            <Text style={[S.typoSubText, { color: colors.subText, marginLeft: 12 }]}>FAB Component</Text>
          </View>
        </View>

        {/* ── INPUTS & SWITCHES ── */}
        <Text style={S.groupLabel}>INPUTS + SWITCHES</Text>
        <View style={S.card}>
          <Text style={[S.inputLabel, { color: colors.muted }]}>TEXT FIELD</Text>
          <TextInput
            style={[S.input, { backgroundColor: colors.background, color: colors.text, borderColor: inputFocused ? colors.primary : colors.border }]}
            placeholder="Focus me to see primary border..."
            placeholderTextColor={colors.subText}
            value={inputVal}
            onChangeText={setInputVal}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />

          <Text style={[S.inputLabel, { color: colors.muted, marginTop: 12 }]}>SEARCH BAR</Text>
          <View style={[S.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={16} color={colors.muted} style={{ marginRight: 8 }} />
            <TextInput style={{ flex: 1, color: colors.text, fontSize: 14 }} placeholder="Search..." placeholderTextColor={colors.subText} />
          </View>

          <Text style={[S.inputLabel, { color: colors.muted, marginTop: 12 }]}>PASSWORD ROW</Text>
          <View style={[S.passwordRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <TextInput style={{ flex: 1, color: colors.text, fontSize: 14 }} placeholder="Password" placeholderTextColor={colors.subText} secureTextEntry />
            <Ionicons name="eye-outline" size={18} color={colors.subText} />
          </View>

          <View style={[S.rowBetween, { marginTop: 16 }]}>
            <Text style={[S.typoBody, { color: colors.text }]}>Toggle Switch</Text>
            <Switch
              value={switchVal}
              onValueChange={setSwitchVal}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        {/* ── BADGES & PILLS ── */}
        <Text style={S.groupLabel}>BADGES & PILLS</Text>
        <View style={S.card}>
          <View style={S.rowWrap}>
            <View style={[S.badge, { backgroundColor: colors.skyBg, borderColor: colors.skyBorder }]}><Text style={[S.badgeText, { color: colors.sky }]}>SOLO</Text></View>
            <View style={[S.badge, { backgroundColor: colors.violetBg, borderColor: colors.violetBorder }]}><Text style={[S.badgeText, { color: colors.violet }]}>TEAM</Text></View>
            <View style={[S.badge, { backgroundColor: colors.successBg, borderColor: colors.successBorder }]}><Text style={[S.badgeText, { color: colors.success }]}>LIVE</Text></View>
            <View style={[S.badge, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}><Text style={[S.badgeText, { color: colors.error }]}>PENDING</Text></View>
            <View style={[S.badge, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}><Text style={[S.badgeText, { color: colors.primary }]}>CAPTAIN</Text></View>
            <View style={[S.badge, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}><Text style={[S.badgeText, { color: colors.warning }]}>SUPER ADMIN</Text></View>
          </View>

          <View style={[S.rowCentered, { marginTop: 16, gap: 16 }]}>
            <View style={{ position: 'relative' }}>
              <Ionicons name="mail-outline" size={24} color={colors.text} />
              <View style={[S.notifBadge, { backgroundColor: colors.error }]}><Text style={S.notifBadgeText}>3</Text></View>
            </View>
            <View style={{ position: 'relative' }}>
              <Ionicons name="person-outline" size={24} color={colors.text} />
              <View style={[S.presenceDot, { backgroundColor: colors.success }]} />
            </View>
            <Text style={[S.typoSubText, { color: colors.subText }]}>Notification / Presence Dots</Text>
          </View>
        </View>

        {/* ── CARDS ── */}
        <Text style={S.groupLabel}>CARDS</Text>
        
        {/* Requirement Card */}
        <View style={[S.listCard, { borderColor: colors.border, borderLeftWidth: 2, borderLeftColor: colors.primary }]}>
          <View style={S.rowBetween}>
            <View style={[S.badge, { backgroundColor: colors.skyBg, borderColor: colors.skyBorder }]}><Text style={[S.badgeText, { color: colors.sky }]}>SOLO</Text></View>
            <AnimatedPressable style={[S.btnSmall, { backgroundColor: colors.primary }]}>
              <Text style={S.btnSmallText}>APPLY</Text>
            </AnimatedPressable>
          </View>
          <Text style={[S.typoH3, { color: colors.text, marginTop: 8 }]}>Opening Batsman</Text>
          <Text style={[S.typoSubText, { color: colors.subText, marginTop: 2 }]}>📍 Gaddafi Stadium · 📅 15 Jul</Text>
        </View>

        {/* Match Card */}
        <View style={[S.listCard, { borderColor: colors.border, borderLeftWidth: 2, borderLeftColor: colors.success }]}>
          <View style={S.rowBetween}>
            <View style={S.rowCentered}>
              <View style={[S.presenceDot, { backgroundColor: colors.success, position: 'relative', top: 0, right: 0, marginRight: 6 }]} />
              <Text style={[S.badgeText, { color: colors.success }]}>IN PROGRESS</Text>
            </View>
            <Text style={[S.badgeText, { color: colors.primary }]}>MY MATCH</Text>
          </View>
          <View style={[S.rowBetween, { marginTop: 12 }]}>
            <View>
              <Text style={[S.typoH3, { color: colors.text }]}>Team Alpha</Text>
              <Text style={[S.typoH2, { color: colors.text }]}>142/6</Text>
            </View>
            <Text style={[S.typoBody, { color: colors.subText, fontWeight: '700' }]}>VS</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[S.typoH3, { color: colors.text }]}>Team Beta</Text>
              <Text style={[S.typoH2, { color: colors.text }]}>—</Text>
            </View>
          </View>
        </View>

        {/* Chat Row Card */}
        <View style={[S.listCard, { borderColor: colors.border }]}>
          <View style={S.rowCentered}>
            <View style={[S.avatarSm, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}><Text style={{ color: colors.primary, fontWeight: '900' }}>B</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={S.rowBetween}>
                <Text style={[S.typoH3, { color: colors.text, fontSize: 14 }]}>Babar Azam</Text>
                <Text style={[S.typoMuted, { color: colors.primary, fontWeight: '700' }]}>3:45 PM</Text>
              </View>
              <View style={S.rowBetween}>
                <Text style={[S.typoSubText, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>Hey, interested in your slot!</Text>
                <View style={[S.notifBadge, { backgroundColor: colors.error, position: 'relative', top: 0, right: 0 }]}><Text style={S.notifBadgeText}>1</Text></View>
              </View>
            </View>
          </View>
        </View>

        {/* ── EMPTY STATE ── */}
        <Text style={S.groupLabel}>EMPTY STATE</Text>
        <View style={S.emptyState}>
          <Ionicons name="folder-open-outline" size={40} color={colors.muted} style={{ marginBottom: 12 }} />
          <Text style={[S.typoH3, { color: colors.text, marginBottom: 8 }]}>No Data Found</Text>
          <Text style={[S.typoSubText, { color: colors.subText, textAlign: 'center' }]}>Looks like there is nothing to show here yet.</Text>
        </View>

        {/* ── AVATARS ── */}
        <Text style={S.groupLabel}>AVATARS</Text>
        <View style={S.card}>
          <View style={S.rowCentered}>
            <View style={[S.avatarLg, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}><Text style={{ color: colors.primary, fontWeight: '900', fontSize: 24 }}>AB</Text></View>
            <View style={[S.avatarMd, { backgroundColor: colors.skyBg, borderColor: colors.skyBorder, marginLeft: 12 }]}><Text style={{ color: colors.sky, fontWeight: '900', fontSize: 18 }}>C</Text></View>
            <View style={[S.avatarSm, { backgroundColor: colors.violetBg, borderColor: colors.violetBorder, marginLeft: 12 }]}><Text style={{ color: colors.violet, fontWeight: '900', fontSize: 14 }}>D</Text></View>
          </View>
        </View>

        {/* ── ALERTS / BANNERS ── */}
        <Text style={S.groupLabel}>ALERTS & BANNER BARS</Text>
        <View style={[S.alertBar, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
          <Text style={[S.typoBody, { color: colors.primary, fontWeight: '700' }]}>ℹ️ Info — Looking for solo players.</Text>
        </View>
        <View style={[S.alertBar, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder, marginTop: 8 }]}>
          <Text style={[S.typoBody, { color: colors.warning, fontWeight: '700' }]}>⚠️ Warning — Pending request.</Text>
        </View>
        <View style={[S.alertBar, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder, marginTop: 8 }]}>
          <Text style={[S.typoBody, { color: colors.error, fontWeight: '700' }]}>❌ Error — Upload failed.</Text>
        </View>
        <View style={[S.alertBar, { backgroundColor: colors.successBg, borderColor: colors.successBorder, marginTop: 8 }]}>
          <Text style={[S.typoBody, { color: colors.success, fontWeight: '700' }]}>✅ Success — Application sent!</Text>
        </View>

        {/* ── SKELETON ── */}
        <Text style={S.groupLabel}>SKELETON LOADER</Text>
        <View style={S.card}>
          <Animated.View style={{ opacity: pulseAnim }}>
            <View style={[S.skeletonLine, { width: '50%', backgroundColor: colors.surfaceRaised }]} />
            <View style={[S.skeletonLine, { width: '80%', backgroundColor: colors.surfaceRaised, marginTop: 8 }]} />
            <View style={[S.skeletonLine, { width: '65%', backgroundColor: colors.surfaceRaised, marginTop: 8 }]} />
          </Animated.View>
        </View>

        {/* ── DIVIDERS ── */}
        <Text style={S.groupLabel}>DIVIDERS</Text>
        <View style={S.card}>
          <View style={[S.divider, { backgroundColor: colors.border }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
            <View style={[S.divider, { flex: 1, backgroundColor: colors.border }]} />
            <Text style={[S.typoLabel, { color: colors.muted, marginHorizontal: 12 }]}>OR</Text>
            <View style={[S.divider, { flex: 1, backgroundColor: colors.border }]} />
          </View>
        </View>

        <View style={{ height: 60 }} />
      </Animated.ScrollView>
    </SafeAreaWrapper>
  );
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    page: { padding: 16 },
    headerSection: { marginBottom: 24, alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '900', color: colors.primary, letterSpacing: -0.3 },
    headerSub: { fontSize: 13, color: colors.subText, marginTop: 4 },
    groupLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, color: colors.muted, marginBottom: 8, marginTop: 24, textTransform: 'uppercase' },
    card: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 8, gap: 12 },
    rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    rowCentered: { flexDirection: 'row', alignItems: 'center' },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    swatchRow: { flexDirection: 'row', gap: 8 },
    swatch: { width: 44, height: 44, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    swatchLabel: { fontSize: 9, fontWeight: '900', color: '#ffffff' },

    typoH1: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    typoH2: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    typoH3: { fontSize: 15, fontWeight: '700' },
    typoBody: { fontSize: 14, fontWeight: '400' },
    typoSubText: { fontSize: 12, fontWeight: '400' },
    typoMuted: { fontSize: 11, fontWeight: '400' },
    typoLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
    typoCaption: { fontSize: 12, fontWeight: '700' },

    btnPrimary: { backgroundColor: colors.primary, borderRadius: 6, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
    btnPrimaryText: { color: '#ffffff', fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
    btnOutline: { borderRadius: 6, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center', borderWidth: 1 },
    btnOutlineText: { fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
    btnGhost: { paddingVertical: 12, alignItems: 'center' },
    btnGhostText: { fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
    btnSmall: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
    btnSmallText: { color: '#ffffff', fontWeight: '900', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
    fab: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },

    inputLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
    input: { borderRadius: 6, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
    searchBar: { borderRadius: 6, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
    passwordRow: { borderRadius: 6, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },

    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
    badgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
    notifBadge: { position: 'absolute', top: -4, right: -6, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    notifBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
    presenceDot: { position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: colors.surface },

    listCard: { backgroundColor: colors.surface, borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 10 },
    emptyState: { backgroundColor: colors.surfaceRaised, borderRadius: 12, padding: 32, alignItems: 'center' },
    
    avatarLg: { width: 64, height: 64, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    avatarMd: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    avatarSm: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

    alertBar: { borderRadius: 6, borderWidth: 1, padding: 12 },
    skeletonLine: { height: 12, borderRadius: 6 },
    divider: { height: 1 },
  });
}
