import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import type { z } from 'zod';

import { useDeleteAccount } from '@/api/auth';
import { describeError, toApiError } from '@/api/errors';
import { FormTextField } from '@/components/form/form-text-field';
import { Button, Spinner, Text } from '@/components/ui';

import { AccountForm } from './account-form';
import { createDeleteAccountSchema, type DeleteAccountValues } from './schema';

/** Error codes shown in the app language instead of the server's English message. */
const KNOWN_ERRORS = {
  WRONG_PASSWORD: 'account.wrongPassword',
  ACCOUNT_NOT_DELETABLE: 'account.notDeletable',
} as const;

export function DeleteAccountScreen() {
  const { t } = useTranslation();
  const { mutate: remove, isPending, error } = useDeleteAccount();
  const { control, handleSubmit } = useForm<
    DeleteAccountValues,
    unknown,
    z.output<ReturnType<typeof createDeleteAccountSchema>>
  >({ resolver: zodResolver(createDeleteAccountSchema(t)), defaultValues: { password: '' } });

  // Signing out (in the mutation) moves the app back to the login screen by itself.
  const onSubmit = handleSubmit(({ password }) =>
    Alert.alert(t('account.deleteConfirmTitle'), t('account.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.delete'), style: 'destructive', onPress: () => remove(password) },
    ]),
  );
  const code = error ? toApiError(error).serverCode : undefined;
  const known = code && code in KNOWN_ERRORS ? KNOWN_ERRORS[code as keyof typeof KNOWN_ERRORS] : null;

  return (
    <AccountForm
      title={t('account.deleteTitle')}
      icon="trash-outline"
      tone="pink"
      intro={t('account.deleteIntro')}
      actions={
        <Button variant="danger" className="flex-1" onPress={onSubmit} isDisabled={isPending}>
          {isPending ? <Spinner size="sm" /> : null}
          <Button.Label>{t('account.delete')}</Button.Label>
        </Button>
      }
    >
      <FormTextField
        control={control}
        name="password"
        label={t('auth.password')}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      {error ? (
        <Text className="text-danger">{known ? t(known) : describeError(error, t)}</Text>
      ) : null}
    </AccountForm>
  );
}
