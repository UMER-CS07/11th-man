// app/(user)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/src/context/ThemeContext';
import { useUnreadCount } from '@/src/hooks/useUnreadCount';

function BadgeIcon({ name, size, color, count }: { name: any; size: number; color: string; count: number }) {
  const { colors } = useTheme();

  return (
    <View style={styles.iconContainer}>
      <Ionicons name={name} size={size} color={color} />
      {count > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function UserTabsLayout() {
  const { colors } = useTheme();
  const { total, requests } = useUnreadCount();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <BadgeIcon name="compass-outline" size={size} color={color} count={requests} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <BadgeIcon name="chatbubbles-outline" size={size} color={color} count={total} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          title: 'Weather',
          tabBarIcon: ({ color, size }) => <Ionicons name="partly-sunny-outline" size={size} color={color} />,
        }}
      />
      {/* Hidden screens — navigated to programmatically */}
      <Tabs.Screen name="match-details" options={{ href: null }} />
      <Tabs.Screen name="chat/[id]" options={{ href: null }} />
      <Tabs.Screen name="scorecard" options={{ href: null }} />
      <Tabs.Screen name="scorer" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="theme-showcase" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    borderRadius: 4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
});


