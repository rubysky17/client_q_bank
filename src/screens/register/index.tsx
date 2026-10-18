import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRegister } from '@/api/auth';
import { describeError } from '@/api/errors';
import { FormTextField } from '@/components/form/form-text-field';
import { Button, GradientButton, Text } from '@/components/ui';
import { AuthHero } from '@/screens/login/auth-hero';

import { createRegisterSchema, type RegisterValues } from './schema';

const DEFAULT_VALUES: RegisterValues = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function RegisterScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { back } = useRouter();
  const { mutate: register, isPending, error } = useRegister();
  const { control, handleSubmit, setFocus } = useForm<
    RegisterValues,
    unknown,
    z.output<ReturnType<typeof createRegisterSchema>>
  >({
    resolver: zodResolver(createRegisterSchema(t)),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit(({ fullName, email, password }) =>
    register({ fullName, email, password }),
  );

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="grow"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <AuthHero title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} />

      <Animated.View
        entering={FadeInDown.delay(120).duration(500)}
        className="-mt-7 grow gap-5 rounded-t-[28px] bg-background px-5 pt-6"
      >
        <FormTextField
          control={control}
          name="fullName"
          label={t('auth.fullName')}
          placeholder={t('auth.fullNamePlaceholder')}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => setFocus('email')}
        />
        <FormTextField
          control={control}
          name="email"
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => setFocus('password')}
        />
        <FormTextField
          control={control}
          name="password"
          label={t('auth.password')}
          placeholder={t('auth.newPasswordPlaceholder')}
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
        {error ? <Text className="text-danger">{describeError(error, t)}</Text> : null}
        <GradientButton label={t('auth.registerSubmit')} onPress={onSubmit} isLoading={isPending} />

        <View className="flex-row items-center justify-center">
          <Text type="body-sm" color="muted">
            {t('auth.haveAccount')}
          </Text>
          <Button variant="ghost" size="sm" onPress={back}>
            <Button.Label className="text-accent">{t('auth.submit')}</Button.Label>
          </Button>
        </View>
      </Animated.View>
    </KeyboardAwareScrollView>
  );
}
