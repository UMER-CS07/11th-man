// File: app/(user)/profile.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, Animated } from 'react-native';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { AnimatedPressable } from '@/src/components/AnimatedPressable';
import { supabase } from '@/src/services/supabase';
import { storageService } from '@/src/utils/storageService';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { session, role, profile, roleLoaded, refreshProfile } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Logout Error', error.message);
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.7,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const fileExt = asset.uri.split('.').pop() || 'jpg';
      const fileName = `avatars/${session?.user?.id}-${Date.now()}.${fileExt}`;

      setUploading(true);
      setUploadProgress(0);

      // Req #05: Upload via axios with real onUploadProgress tracking
      await storageService.uploadWithProgress(
        asset.uri,
        fileName,
        `image/${fileExt}`,
        (pct) => setUploadProgress(pct)
      );

      // Req #05: Get a signed URL for private bucket access
      const signedUrl = await storageService.getSignedUrl(fileName, 60 * 60 * 24 * 365);
      if (!signedUrl) throw new Error('Could not generate signed URL');

      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_url: signedUrl }).eq('id', session?.user?.id);
      if (updateError) throw updateError;

      if (refreshProfile) await refreshProfile();
      Alert.alert('✅ Success', 'Profile picture updated!');
    } catch (error: any) {
      Alert.alert('Upload Error', error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const fullName = profile?.full_name || session?.user?.user_metadata?.full_name || 'Cricket Player';
  const username = profile?.username || session?.user?.user_metadata?.username || '';
  const email = session?.user?.email || '';
  const avatarUrl = profile?.avatar_url;
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const isCaptain = roleLoaded && role === 'CAPTAIN';
  const isSuperAdmin = roleLoaded && role === 'SUPER_ADMIN';

  const roleBadgeBg = isSuperAdmin ? colors.warningBg : isCaptain ? colors.primaryBg : colors.surfaceRaised;
  const roleBadgeBorder = isSuperAdmin ? colors.warningBorder : isCaptain ? colors.primaryBorder : colors.border;
  const roleBadgeText = isSuperAdmin ? colors.warning : isCaptain ? colors.primary : colors.muted;

  return (
    <SafeAreaWrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Profile Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleImagePick} disabled={uploading}>
              <View style={[styles.avatarSquare, { backgroundColor: colors.primaryBg, borderColor: uploading ? colors.primary : colors.primaryBorder, overflow: 'hidden' }]}>
                {avatarUrl && !uploading ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 90, height: 90 }} />
                ) : (
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{initials || '?'}</Text>
                )}
              </View>
              {!uploading && (
                <View style={[styles.editIconBadge, { backgroundColor: colors.sky }]}>
                  <Ionicons name="camera" size={12} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Req #05: Upload Progress Bar with Percentage */}
            {uploading && (
              <View style={styles.progressWrapper}>
                <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                  <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${uploadProgress}%` as any }]} />
                </View>
                <Text style={[styles.progressLabel, { color: colors.primary }]}>
                  Uploading {uploadProgress}%
                </Text>
              </View>
            )}

            <Text style={[styles.nameText, { color: colors.text }]}>{fullName}</Text>
            {username ? <Text style={[styles.usernameText, { color: colors.primary }]}>@{username}</Text> : null}
            <Text style={[styles.email, { color: colors.subText }]}>{email}</Text>

            <View style={[styles.roleBadge, { backgroundColor: roleBadgeBg, borderWidth: 1, borderColor: roleBadgeBorder }]}>
              {roleLoaded ? (
                <Text style={[styles.roleText, { color: roleBadgeText }]}>
                  {isSuperAdmin ? 'SUPER ADMIN' : role}
                </Text>
              ) : (
                <Text style={[styles.roleText, { color: colors.muted }]}>Loading...</Text>
              )}
            </View>
          </View>

          {/* Stats Row */}
          <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {[
              { label: 'MATCHES', value: '—' },
              { label: 'WINS', value: '—' },
              { label: 'AVG', value: '—' },
            ].map((stat) => (
              <View key={stat.label} style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Preferences Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionGroupLabel, { color: colors.muted }]}>PREFERENCES</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.rowText, { color: colors.text }]}>Display Theme</Text>
              <AnimatedPressable
                style={[styles.themeToggle, { borderColor: colors.primaryBorder, backgroundColor: colors.primaryBg }]}
                onPress={toggleTheme}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                  {isDark ? '🌙 Dark' : '☀️ Light'}
                </Text>
              </AnimatedPressable>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: 'transparent' }]}>
              <Text style={[styles.rowText, { color: colors.text }]}>Component Gallery</Text>
              <AnimatedPressable
                style={[styles.themeToggle, { borderColor: colors.border }]}
                onPress={() => router.push('/(user)/theme-showcase')}
              >
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>🎨 View</Text>
              </AnimatedPressable>
            </View>
          </View>

          {/* Admin Quick Actions */}
          {isCaptain && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.sectionGroupLabel, { color: colors.muted }]}>ADMIN ACTIONS</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

              <AnimatedPressable style={[styles.adminBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/(admin)/match-setup')}>
                <Text style={styles.adminBtnText}>🏏 Host New Match</Text>
              </AnimatedPressable>
              <AnimatedPressable style={[styles.adminBtn, { backgroundColor: colors.violet, marginTop: 10 }]} onPress={() => router.push('/(admin)/create-requirement')}>
                <Text style={styles.adminBtnText}>📋 Post Requirement</Text>
              </AnimatedPressable>
              <AnimatedPressable style={[styles.adminBtn, { backgroundColor: colors.sky, marginTop: 10 }]} onPress={() => router.push('/(admin)/financial-dashboard')}>
                <Text style={styles.adminBtnText}>💰 Financial Dashboard</Text>
              </AnimatedPressable>
            </View>
          )}

          {/* Payments — visible to all users */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionGroupLabel, { color: colors.muted }]}>PAYMENTS</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <AnimatedPressable
              style={[styles.adminBtn, { backgroundColor: colors.violet }]}
              onPress={() => router.push('/(admin)/financial-dashboard')}
            >
              <Text style={styles.adminBtnText}>💳 Transaction History</Text>
            </AnimatedPressable>
          </View>

          {/* Logout */}
          <AnimatedPressable
            style={[styles.logoutButton, { backgroundColor: colors.errorBg, borderWidth: 1, borderColor: colors.errorBorder }]}
            onPress={handleLogout}
          >
            <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
          </AnimatedPressable>

        </ScrollView>
      </Animated.View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, paddingBottom: 40 },
  headerContainer: { alignItems: 'center', marginTop: 10, marginBottom: 24 },
  avatarSquare: { width: 90, height: 90, borderRadius: 8, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarText: { fontSize: 30, fontWeight: '900' },
  editIconBadge: { position: 'absolute', bottom: 14, right: -4, width: 26, height: 26, borderRadius: 6, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  progressWrapper: { width: '80%', alignItems: 'center', marginTop: 4, marginBottom: 8 },
  progressBg: { width: '100%', height: 6, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 11, fontWeight: '700', marginTop: 4, letterSpacing: 0.5 },
  nameText: { fontSize: 20, fontWeight: '800', marginBottom: 2, letterSpacing: -0.3 },
  usernameText: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  email: { fontSize: 12, marginBottom: 10, marginTop: 2 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  roleText: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 16, paddingVertical: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  sectionGroupLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 },
  dividerLine: { height: 1, marginBottom: 14 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, marginBottom: 12 },
  rowText: { fontSize: 14, fontWeight: '500' },
  themeToggle: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6 },
  adminBtn: { paddingVertical: 11, paddingHorizontal: 20, borderRadius: 6, alignItems: 'center' },
  adminBtnText: { color: '#ffffff', fontWeight: '900', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  logoutButton: { paddingVertical: 13, paddingHorizontal: 20, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  logoutText: { fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
});
