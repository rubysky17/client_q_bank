import type { ErrorBoundaryProps } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

/**
 * Last-resort screen for render errors. Uses plain RN + Uniwind classes only, because it can
 * render outside AppProviders (e.g. when a provider itself throws).
 */
export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <Text className="text-center text-lg font-semibold text-foreground">
        {t('errors.unknown')}
      </Text>
      {__DEV__ ? (
        <Text className="text-center font-mono text-sm text-danger">{error.message}</Text>
      ) : null}
      <Pressable onPress={retry} className="rounded-xl bg-accent px-5 py-3">
        <Text className="font-medium text-accent-foreground">{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}
