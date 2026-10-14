import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/ui';

export default function NotFoundRoute() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: t('notFound.title') }} />
      <View className="flex-1 items-center justify-center gap-4 p-6">
        <Text type="h4">{t('notFound.title')}</Text>
        <Link href="/" className="font-medium text-accent">
          {t('common.goHome')}
        </Link>
      </View>
    </>
  );
}
