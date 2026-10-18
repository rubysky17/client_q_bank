import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useMe } from '@/api/auth';
import { GradientView, Skeleton, Text } from '@/components/ui';

import { ContinueCards } from './continue-cards';
import { DailyGoalCard } from './daily-goal-card';
import { HomeStats } from './home-stats';

export function HomeHeader() {
  const { t } = useTranslation();
  const { data: me, isPending } = useMe();

  return (
    <View className="gap-4 pb-3">
      <View className="flex-row items-center gap-3">
        <GradientView className="size-11 items-center justify-center rounded-full">
          <Text weight="semibold" className="text-on-brand">
            {me?.fullName.charAt(0).toUpperCase() ?? ''}
          </Text>
        </GradientView>
        {isPending ? (
          <View className="flex-1 gap-1.5">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-3 w-52 rounded-full" />
          </View>
        ) : (
          <View className="flex-1">
            <Text type="h6" numberOfLines={1}>
              {t('home.greeting', { name: me?.fullName ?? '' })}
            </Text>
            <Text type="body-xs" color="muted">
              {t('home.subtitle')}
            </Text>
          </View>
        )}
      </View>
      <ContinueCards />
      <DailyGoalCard />
      <HomeStats />
      <View className="flex-row items-center justify-between pt-1">
        <Text type="h6">{t('home.title')}</Text>
      </View>
    </View>
  );
}
