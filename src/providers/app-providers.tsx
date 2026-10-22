import '@/lib/polyfills';
import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { HeroUINativeProvider } from 'heroui-native';
import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { startAttemptSync } from '@/api/attempt-sync';
import { startUserStateSync } from '@/api/user-state-sync';
import { startVocabSync } from '@/api/vocab-sync';
import { configureNotifications } from '@/lib/reminders';
import { startAccountSettingsSync } from '@/sync/account-settings';
import { startSync } from '@/sync/coordinator';

import { DevTools } from './dev-tools';
import { NavigationTheme } from './navigation-theme';
import { queryClient } from './query-client';
import { startSettingsSync } from './settings-sync';

startSettingsSync();
configureNotifications();
// Before `startSync`: it loads the signed-in user, which the settings follow.
startAccountSettingsSync();
startSync();
startAttemptSync();
startVocabSync();
startUserStateSync();

/** Every app-wide provider, outermost first. Add new ones here, not in route files. */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
          <HeroUINativeProvider>
            <NavigationTheme>{children}</NavigationTheme>
            {__DEV__ ? <DevTools /> : null}
          </HeroUINativeProvider>
        </QueryClientProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
