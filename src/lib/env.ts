import { z } from 'zod';

const EnvSchema = z.object({
  /**
   * Base URL of the Q Bank API, including the `/api/v1` prefix. Always ends with `/`: ky resolves
   * `auth/login` against it like a browser would, so without the slash `/v1` would be replaced.
   */
  EXPO_PUBLIC_API_URL: z
    .url()
    .default('https://back-q-bank.vodat10998.workers.dev/api/v1')
    .transform((url) => (url.endsWith('/') ? url : `${url}/`)),
});

// Each EXPO_PUBLIC_* var must be referenced literally: Expo inlines them at build time,
// so `process.env[name]` would always be undefined.
export const env = EnvSchema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});
