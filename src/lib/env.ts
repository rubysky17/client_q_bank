import { z } from 'zod';

const EnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url().default('https://dummyjson.com'),
});

// Each EXPO_PUBLIC_* var must be referenced literally: Expo inlines them at build time,
// so `process.env[name]` would always be undefined.
export const env = EnvSchema.parse({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
});
