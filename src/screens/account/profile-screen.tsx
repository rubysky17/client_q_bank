import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';

import { useMe, useUpdateProfile } from '@/api/auth';
import { describeError } from '@/api/errors';
import { FormTextField } from '@/components/form/form-text-field';
import { GradientButton, LoadingView, Text } from '@/components/ui';

import { AccountForm } from './account-form';
import { createProfileSchema, type ProfileValues } from './schema';

export function ProfileScreen() {
  const { data: me } = useMe();
  if (!me) return <LoadingView />;
  // Keyed form: the default value is the name as it was when the screen opened.
  return <ProfileForm fullName={me.fullName} email={me.email} />;
}

function ProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const { t } = useTranslation();
  const { back } = useRouter();
  const { mutate: save, isPending, error } = useUpdateProfile();
  const { control, handleSubmit } = useForm<
    ProfileValues,
    unknown,
    z.output<ReturnType<typeof createProfileSchema>>
  >({ resolver: zodResolver(createProfileSchema(t)), defaultValues: { fullName } });

  const onSubmit = handleSubmit((values) => save(values, { onSuccess: () => back() }));

  return (
    <AccountForm
      title={t('account.profileTitle')}
      icon="person-circle-outline"
      tone="blue"
      intro={t('account.profileIntro', { email })}
      actions={
        <GradientButton
          className="flex-1"
          icon="checkmark"
          label={t('account.save')}
          isLoading={isPending}
          onPress={onSubmit}
        />
      }
    >
      <FormTextField
        control={control}
        name="fullName"
        label={t('auth.fullName')}
        placeholder={t('auth.fullNamePlaceholder')}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      {error ? <Text className="text-danger">{describeError(error, t)}</Text> : null}
    </AccountForm>
  );
}
