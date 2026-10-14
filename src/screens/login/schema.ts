import type { TFunction } from 'i18next';
import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 6;

/** Built with `t` so validation messages follow the current language. */
export function createLoginSchema(t: TFunction) {
  return z.object({
    username: z.string().trim().min(1, t('auth.validation.usernameRequired')),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, t('auth.validation.passwordMin', { count: PASSWORD_MIN_LENGTH })),
  });
}

export type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;
