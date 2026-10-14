import {
  focusManager,
  MutationCache,
  onlineManager,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query';
import * as Network from 'expo-network';
import { AppState, Platform } from 'react-native';

import { shouldRetryRequest } from '@/api/errors';
import { createLogger } from '@/lib/logger';

const log = createLogger('query');

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => log.warn('query failed', query.queryKey, error),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) =>
      log.warn('mutation failed', mutation.options.mutationKey, error),
  }),
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: shouldRetryRequest,
    },
    mutations: {
      retry: false,
    },
  },
});

// On web TanStack already listens to window focus/online events (and `window` doesn't exist
// during static rendering), so only wire the native equivalents.
if (Platform.OS !== 'web') {
  // Refetch stale queries when the app comes back to the foreground.
  AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });

  // Pause queries while offline; resume (and refetch) when the connection returns.
  onlineManager.setEventListener((setOnline) => {
    const subscription = Network.addNetworkStateListener((state) => {
      setOnline(state.isConnected !== false);
    });
    return () => subscription.remove();
  });
}
