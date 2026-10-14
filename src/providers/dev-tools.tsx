import { useMMKVDevTools } from '@rozenite/mmkv-plugin';
import { useTanStackQueryDevTools } from '@rozenite/tanstack-query-plugin';

import { storage } from '@/stores/storage';

import { queryClient } from './query-client';

/**
 * Feeds Rozenite panels in React Native DevTools (run `npm run devtools`, then press `j`):
 * "TanStack Query" (cache, refetch, invalidate) and "MMKV Storage" (persisted zustand state).
 * Rendered only when __DEV__.
 */
export function DevTools() {
  useTanStackQueryDevTools(queryClient);
  useMMKVDevTools({ storages: [storage] });
  return null;
}
