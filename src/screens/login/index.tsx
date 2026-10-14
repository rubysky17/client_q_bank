import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLogin } from '@/api/auth';
import { describeError } from '@/api/errors';
import { FormTextField } from '@/components/form/form-text-field';
import { Button, Card, Spinner, Text, useThemeColor } from '@/components/ui';

import { createLoginSchema, type LoginValues } from './schema';

// Pre-filled in development so you can sign in with one tap while debugging.
const DEFAULT_VALUES: LoginValues = __DEV__
  ? { username: 'emilys', password: 'emilyspass' }
  : { username: '', password: '' };

export function LoginScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const accentForeground = useThemeColor('accent-foreground');
  const { mutate: login, isPending, error } = useLogin();
  const { control, handleSubmit, setFocus } = useForm<LoginValues>({
    resolver: zodResolver(createLoginSchema(t)),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = handleSubmit((values) => login(values));

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Animated.View entering={FadeInDown.duration(500)} className="items-center gap-2">
        <View className="mb-2 size-16 items-center justify-center rounded-2xl bg-accent">
          <Ionicons name="library" size={32} color={accentForeground} />
        </View>
        <Text type="h2">Q Bank</Text>
        <Text color="muted">{t('auth.subtitle')}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(500)}>
        <Card>
          <Card.Body className="gap-4">
            <FormTextField
              control={control}
              name="username"
              label={t('auth.username')}
              placeholder={t('auth.usernamePlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
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
            <Button onPress={onSubmit} isDisabled={isPending}>
              {isPending ? <Spinner size="sm" /> : null}
              <Button.Label>{t('auth.submit')}</Button.Label>
            </Button>
          </Card.Body>
        </Card>
      </Animated.View>

      <Text type="body-sm" color="muted" align="center">
        {t('auth.demoHint')}
      </Text>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 24,
    paddingHorizontal: 20,
  },
});
