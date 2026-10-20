import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useMe } from '@/api/auth';
import { GradientView, IconButton, PressableFeedback, Skeleton, Text } from '@/components/ui';

import { ContinueCards } from './continue-cards';
import { DailyGoalCard } from './daily-goal-card';
import { HomeStats } from './home-stats';

export function HomeHeader() {
  const { t } = useTranslation();
  const { data: me, isPending } = useMe();
  const { push } = useRouter();
  // Settings is not a tab (Android allows five): the avatar and the gear open it.
  const openSettings = () => push('/settings');

  return (
    <View className="gap-4 pb-3">
      <View className="flex-row items-center gap-3">
        <PressableFeedback
          onPress={openSettings}
          accessibilityRole="button"
          accessibilityLabel={t('settings.title')}
          className="rounded-full"
        >
          <GradientView className="size-11 items-center justify-center rounded-full">
            <Text weight="semibold" className="text-on-brand">
              {me?.fullName.charAt(0).toUpperCase() ?? ''}
            </Text>
          </GradientView>
        </PressableFeedback>
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
        <IconButton
          icon="settings-outline"
          onPress={openSettings}
          accessibilityLabel={t('settings.title')}
        />
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
