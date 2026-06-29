import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaWrapper } from '@/src/components/SafeAreaWrapper';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function EditRosterScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaWrapper style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Edit Team Roster</Text>
      
      {/* Player Row */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.row}>
          <Ionicons name="menu-outline" size={24} color={colors.muted} style={{ marginRight: 12 }} />
          <View style={styles.playerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>Ali Khan</Text>
              <View style={[styles.captainBadge, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>C</Text>
              </View>
            </View>
            <Text style={{ color: colors.subText, fontSize: 14 }}>Role: Fast Bowler</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.removeBtn, { backgroundColor: 'transparent', borderColor: colors.error }]}>
          <Text style={{ color: colors.error, fontWeight: 'bold' }}>Remove</Text>
        </TouchableOpacity>
      </View>

      {/* Add Player Button */}
      <TouchableOpacity style={[styles.addBtn, { borderColor: colors.border }]}>
        <Text style={{ color: colors.text, fontWeight: 'bold' }}>+ Add Player</Text>
      </TouchableOpacity>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  card: { padding: 16, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  playerInfo: { flex: 1 },
  captainBadge: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 8 },
  removeBtn: { borderWidth: 1, borderRadius: 6, paddingVertical: 8, alignItems: 'center' },
  addBtn: { borderWidth: 1, borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 12, borderStyle: 'dashed' }
});
