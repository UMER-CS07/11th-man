// app/(admin)/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/src/context/ThemeContext';

export default function AdminLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { 
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.primary,
        headerTitleStyle: { 
          fontSize: 14, 
          fontWeight: '900', 
          letterSpacing: 1.5, 
          textTransform: 'uppercase', 
          color: colors.text 
        },
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="match-setup" options={{ title: 'Host New Match' }} />
      <Stack.Screen name="create-requirement" options={{ title: 'Post Requirement' }} />
      <Stack.Screen name="edit-roster" options={{ title: 'Edit Roster' }} />
      <Stack.Screen name="financial-dashboard" options={{ title: 'Financial Dashboard' }} />
      <Stack.Screen name="post-match" options={{ title: 'Post Match' }} />
    </Stack>
  );
}
