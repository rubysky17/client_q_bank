import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAttempts } from '@/api/attempts';
import { useReportExams } from '@/api/reports';
import { Card, type IconName, IconTile, Text, type Tone } from '@/components/ui';
import { countByDay, currentStreak } from '@/utils/activity';

/**
 * Day streak (from the loaded attempt history), average % correct and finished attempts (from the
 * report summaries). Shown only once the user has finished an exam.
 */
export function HomeStats() {
  const { t } = useTranslation();
  const { data: reportExams } = useReportExams();
  const { data: attempts } = useAttempts();
  if (!reportExams || reportExams.length === 0) return null;

  const finished = reportExams.reduce((sum, exam) => sum + exam.attemptCount, 0);
  const avgCorrect = Math.round(
    reportExams.reduce((sum, exam) => sum + exam.avgCorrectPercent * exam.attemptCount, 0) /
      Math.max(finished, 1),
  );
  const streak = attempts
    ? currentStreak(countByDay(attempts.map((a) => a.startedAt)), new Date())
    : null;

  return (
    <View className="flex-row gap-3">
      <Stat
        tone="orange"
        icon="flame"
        value={streak === null ? '—' : String(streak)}
        label={t('home.streak', { count: streak ?? 0 })}
      />
      <Stat tone="blue" icon="trending-up" value={`${avgCorrect}%`} label={t('home.avgCorrect')} />
      <Stat
        tone="violet"
        icon="checkmark-done"
        value={String(finished)}
        label={t('home.finished', { count: finished })}
      />
    </View>
  );
}

type StatProps = {
  tone: Tone;
  icon: IconName;
  value: string;
  label: string;
};

function Stat({ tone, icon, value, label }: StatProps) {
  return (
    <Card className="flex-1 gap-2 border border-border p-3">
      <IconTile tone={tone} icon={icon} size="sm" />
      <Text type="h4">{value}</Text>
      <Text type="body-xs" color="muted" numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}
