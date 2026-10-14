import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { useAuthStore } from '@/stores/auth-store';

import { api, endSession } from './client';
import { queryKeys } from './query-keys';

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  image: z.string(),
});
export type User = z.infer<typeof UserSchema>;

const LoginResponseSchema = UserSchema.extend({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type LoginInput = { username: string; password: string };

export const meQueryOptions = queryOptions({
  queryKey: queryKeys.auth.me,
  queryFn: ({ signal }) => api.get('auth/me', { signal }).json(UserSchema),
  staleTime: 5 * 60_000,
});

export function useMe() {
  return useQuery(meQueryOptions);
}

export function useLogin() {
  const signIn = useAuthStore((s) => s.signIn);

  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: (input: LoginInput) =>
      api.post('auth/login', { json: { ...input, expiresInMins: 60 } }).json(LoginResponseSchema),
    onSuccess: async ({ accessToken }) => {
      await signIn(accessToken);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: endSession,
  });
}
