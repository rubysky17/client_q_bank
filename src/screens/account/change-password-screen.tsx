import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import type { z } from 'zod';

import { useChangePassword } from '@/api/auth';
import { describeError, toApiError } from '@/api/errors';
import { FormTextField } from '@/components/form/form-text-field';
import { GradientButton, Text } from '@/components/ui';

import { AccountForm } from './account-form';
import { type ChangePasswordValues, createChangePasswordSchema, PASSWORD_MIN } from './schema';

const DEFAULT_VALUES: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function ChangePasswordScreen() {
  const { t } = useTranslation();
  const { back } = useRouter();
  const { mutate: change, isPending, error } = useChangePassword();
  const { control, handleSubmit, setFocus } = useForm<
    ChangePasswordValues,
    unknown,
    z.output<ReturnType<typeof createChangePasswordSchema>>
  >({ resolver: zodResolver(createChangePasswordSchema(t)), defaultValues: DEFAULT_VALUES });

  const onSubmit = handleSubmit(({ currentPassword, newPassword }) =>
    change(
      { currentPassword, newPassword },
      {
        onSuccess: () =>
          Alert.alert(t('account.passwordChanged'), t('account.passwordChangedHint'), [
            { text: 'OK', onPress: () => back() },
          ]),
      },
    ),
  );

  return (
    <AccountForm
      title={t('account.passwordTitle')}
      icon="lock-closed-outline"
      tone="violet"
      intro={t('account.passwordIntro')}
      actions={
        <GradientButton
          className="flex-1"
          icon="checkmark"
          label={t('account.changePassword')}
          isLoading={isPending}
          onPress={onSubmit}
        />
      }
    >
      <FormTextField
        control={control}
        name="currentPassword"
        label={t('account.currentPassword')}
        placeholder={t('auth.passwordPlaceholder')}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => setFocus('newPassword')}
      />
      <FormTextField
        control={control}
        name="newPassword"
        label={t('account.newPassword')}
        placeholder={t('auth.validation.passwordMin', { count: PASSWORD_MIN })}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => setFocus('confirmPassword')}
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label={t('auth.confirmPassword')}
        placeholder={t('auth.confirmPasswordPlaceholder')}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      {error ? (
        <Text className="text-danger">
          {toApiError(error).serverCode === 'WRONG_PASSWORD'
            ? t('account.wrongPassword')
            : describeError(error, t)}
        </Text>
      ) : null}
    </AccountForm>
  );
}
