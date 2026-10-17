import '@/lib/polyfills';
import '@/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { HeroUINativeProvider } from 'heroui-native';
import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { DevTools } from './dev-tools';
import { NavigationTheme } from './navigation-theme';
import { queryClient } from './query-client';
import { startSettingsSync } from './settings-sync';

startSettingsSync();

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
