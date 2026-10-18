import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLogin } from '@/api/auth';
import { describeError } from '@/api/errors';
import { FormTextField } from '@/components/form/form-text-field';
import { Button, GradientButton, Text } from '@/components/ui';

import { AuthHero } from './auth-hero';
import { createLoginSchema, type LoginValues } from './schema';

const DEFAULT_VALUES: LoginValues = { email: '', password: '' };

export function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  const { mutate: login, isPending, error } = useLogin();
  const { control, handleSubmit, setFocus } = useForm<
    LoginValues,
    unknown,
    z.output<ReturnType<typeof createLoginSchema>>
  >({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit((values) => login(values));

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="grow"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      <AuthHero title={t('auth.welcomeBack')} subtitle={t('auth.welcomeSubtitle')} />

      {/* The sheet overlaps the hero's rounded bottom. */}
      <Animated.View
        entering={FadeInDown.delay(120).duration(500)}
        className="-mt-7 grow gap-5 rounded-t-[28px] bg-background px-5 pt-6"
      >
        <FormTextField
          control={control}
          name="email"
          label={t('auth.email')}
          placeholder={t('auth.emailPlaceholder')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => setFocus('password')}
        />
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
        {error ? <Text className="text-danger">{describeError(error, t)}</Text> : null}
        <GradientButton label={t('auth.submit')} onPress={onSubmit} isLoading={isPending} />

        <View className="flex-row items-center justify-center">
          <Text type="body-sm" color="muted">
            {t('auth.noAccount')}
          </Text>
          <Button variant="ghost" size="sm" onPress={() => push('/register')}>
            <Button.Label className="text-accent">{t('auth.registerLink')}</Button.Label>
          </Button>
        </View>
      </Animated.View>
    </KeyboardAwareScrollView>
  );
}
