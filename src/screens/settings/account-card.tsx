import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useMe } from '@/api/auth';
import { useAttempts } from '@/api/attempts';
import { useReportExams } from '@/api/reports';
import { GradientGlow, GradientView, Skeleton, Text } from '@/components/ui';
import { countByDay, currentStreak } from '@/utils/activity';

/** Profile on the brand gradient, with finished attempts, average % correct and day streak. */
export function AccountCard() {
  const { t } = useTranslation();
  const { data: me } = useMe();
  const { data: reportExams } = useReportExams();
  const { data: attempts } = useAttempts();

  const finished = reportExams?.reduce((sum, exam) => sum + exam.attemptCount, 0) ?? null;
  const avgCorrect =
    reportExams && finished
      ? Math.round(
          reportExams.reduce((sum, exam) => sum + exam.avgCorrectPercent * exam.attemptCount, 0) /
            finished,
        )
      : null;
  const streak = attempts
    ? currentStreak(countByDay(attempts.map((a) => a.startedAt)), new Date())
    : null;

  return (
    <GradientView className="gap-4 rounded-3xl p-5">
      <GradientGlow className="-top-16 -right-10 size-44" />
      <View className="flex-row items-center gap-3">
        <View className="size-14 items-center justify-center rounded-full border-4 border-on-brand-track bg-on-brand">
          <Text type="h4" className="text-brand-end">
            {me?.fullName.charAt(0).toUpperCase() ?? ''}
          </Text>
        </View>
        {me ? (
          <View className="flex-1 gap-0.5">
            <Text type="h5" className="text-on-brand" numberOfLines={1}>
              {me.fullName}
            </Text>
            <Text type="body-sm" className="text-on-brand-muted" numberOfLines={1}>
              {me.email}
            </Text>
          </View>
        ) : (
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-3 w-48 rounded-full" />
          </View>
        )}
        {me ? (
          <View className="rounded-full bg-on-brand-subtle px-2.5 py-1">
            <Text type="body-xs" weight="semibold" className="text-on-brand">
              {t(`settings.role.${me.role}`)}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="flex-row gap-2">
        <Stat
          value={finished === null ? '—' : String(finished)}
          label={t('settings.statAttempts')}
        />
        <Stat value={avgCorrect === null ? '—' : `${avgCorrect}%`} label={t('settings.statAvg')} />
        <Stat
          value={streak === null ? '—' : String(streak)}
          label={t('settings.statStreak', { count: streak ?? 0 })}
        />
      </View>
    </GradientView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl bg-on-brand-subtle px-2 py-2.5">
      <Text type="h5" className="text-on-brand">
        {value}
      </Text>
      <Text type="body-xs" className="text-on-brand-muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
