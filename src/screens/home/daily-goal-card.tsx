import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAttempts } from '@/api/attempts';
import { Card, ProgressRing, Text } from '@/components/ui';
import { useLocalAttempts } from '@/stores/attempt-sessions';
import { useSettingsStore } from '@/stores/settings-store';
import { answeredToday } from '@/utils/activity';

/** Today's answered questions against the daily goal set in Settings (hidden without a goal). */
export function DailyGoalCard() {
  const { t } = useTranslation();
  const dailyGoal = useSettingsStore((s) => s.dailyGoal);
  const { data: attempts } = useAttempts();
  const local = useLocalAttempts();
  if (dailyGoal === null || !attempts) return null;

  const done = answeredToday(attempts, local, new Date());
  const percent = Math.min(100, Math.round((done / dailyGoal) * 100));

  return (
    <Card className="flex-row items-center gap-4 border border-border">
      <ProgressRing percent={percent} size={56} thickness={6}>
        <Text type="body-xs" weight="semibold">{`${percent}%`}</Text>
      </ProgressRing>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text type="body-xs" color="muted">
          {t('home.goalTitle')}
        </Text>
        <Text type="h6" numberOfLines={1}>
          {t('home.goalProgress', { done: Math.min(done, dailyGoal), goal: dailyGoal })}
        </Text>
        <Text type="body-xs" color="muted" numberOfLines={2}>
          {done >= dailyGoal ? t('home.goalDone') : t('home.goalLeft', { count: dailyGoal - done })}
        </Text>
      </View>
    </Card>
  );
}
