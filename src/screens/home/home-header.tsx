import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useMe } from '@/api/auth';
import { Avatar, Skeleton, Text } from '@/components/ui';

import { ContinueCards } from './continue-cards';

export function HomeHeader() {
  const { t } = useTranslation();
  const { data: me, isPending } = useMe();

  return (
    <View className="gap-5 pb-4">
      <View className="flex-row items-center gap-3">
        <Avatar alt={me?.fullName ?? ''} size="md">
          <Avatar.Fallback>{me?.fullName.charAt(0).toUpperCase() ?? ''}</Avatar.Fallback>
        </Avatar>
        {isPending ? (
          <Skeleton className="h-5 w-40 rounded-md" />
        ) : (
          <Text type="h5">{t('home.greeting', { name: me?.fullName ?? '' })}</Text>
        )}
      </View>
      <ContinueCards />
      <Text type="h3">{t('home.title')}</Text>
    </View>
  );
}
