// app/index.tsx
// This is the true entry point. It immediately hands routing control 
// to the RootNavigationGuard in _layout.tsx, which redirects based on auth state.
// It renders nothing itself to avoid a flash of the wrong screen.
import { Redirect } from 'expo-router';

export default function Index() {
  // The _layout.tsx AuthProvider will handle the redirect:
  // - If logged in  → /(user)/discover
  // - If logged out → /(auth)/login
  return <Redirect href="/(auth)/login" />;
}