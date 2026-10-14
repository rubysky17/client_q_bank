import ky from 'ky';

import { env } from '@/lib/env';
import { createLogger } from '@/lib/logger';
import { queryClient } from '@/providers/query-client';
import { useAuthStore } from '@/stores/auth-store';

const log = createLogger('api');

/** Signs out and wipes every cached query so the next user starts clean. */
export async function endSession() {
  await useAuthStore.getState().signOut();
  queryClient.clear();
}

/**
 * Shared HTTP client. Usage: `api.get('posts').json(PostSchema)` — passing a zod schema
 * validates the response and types the result.
 */
export const api = ky.create({
  baseUrl: env.EXPO_PUBLIC_API_URL,
  timeout: 15_000,
  // TanStack Query owns retries (see shouldRetryRequest).
  retry: 0,
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const token = useAuthStore.getState().accessToken;
        if (token) request.headers.set('Authorization', `Bearer ${token}`);
        log.debug('→', request.method, request.url);
      },
    ],
    afterResponse: [
      ({ request, response }) => {
        log.debug('←', response.status, request.method, request.url);
        // Token expired or revoked: drop the session; Stack.Protected sends the user to /login.
        if (response.status === 401 && useAuthStore.getState().accessToken) {
          void endSession();
        }
      },
    ],
  },
});
