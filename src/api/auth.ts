import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getDeviceInfo } from '@/lib/device';
import { useAuthStore } from '@/stores/auth-store';

import { api, endSession } from './client';
import { queryKeys } from './query-keys';
import { AuthResponseSchema, UserSchema } from './session';

export { type User, UserSchema } from './session';

export type LoginInput = { email: string; password: string };
export type RegisterInput = LoginInput & { fullName: string };

export const meQueryOptions = queryOptions({
  queryKey: queryKeys.auth.me,
  queryFn: ({ signal }) => api.get('auth/me', { signal }).json(UserSchema),
  staleTime: 5 * 60_000,
});

export function useMe() {
  return useQuery(meQueryOptions);
}

export function useLogin() {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: (input: LoginInput) =>
      api.post('auth/login', { json: { ...input, ...getDeviceInfo() } }).json(AuthResponseSchema),
    onSuccess: async (session) => {
      queryClient.setQueryData(queryKeys.auth.me, session.user);
      await setTokens(session);
    },
  });
}

/** Creates a USER account (POST /auth/register) and signs it in right away. */
export function useRegister() {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: (input: RegisterInput) =>
      api
        .post('auth/register', { json: { ...input, ...getDeviceInfo() } })
        .json(AuthResponseSchema),
    onSuccess: async (session) => {
      queryClient.setQueryData(queryKeys.auth.me, session.user);
      await setTokens(session);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: async () => {
      // Best effort: end the server session too, but never keep the user signed in on failure.
      await api.post('auth/logout').catch(() => undefined);
      await endSession();
    },
  });
}
