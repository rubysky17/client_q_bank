import '../../global.css';

import { Stack } from 'expo-router';

import { AppProviders } from '@/providers/app-providers';
import { useIsSignedIn } from '@/stores/auth-store';

export { AppErrorBoundary as ErrorBoundary } from '@/components/app-error-boundary';

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

function RootNavigator() {
  const isSignedIn = useIsSignedIn();

  // Stack.Protected swaps the reachable screens when the auth state changes:
  // signing in jumps to (app), signing out (or a 401) jumps back to login.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="register" />
      </Stack.Protected>
    </Stack>
  );
}
