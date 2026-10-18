import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { useAttempts } from '@/api/attempts';
import { Card, Skeleton, Text, useThemeColor } from '@/components/ui';
import { countByDay, currentStreak, type HeatCell, heatmapWeeks } from '@/utils/activity';

// Literal class names so Tailwind generates them.
const LEVEL = ['bg-surface-secondary', 'bg-chart-1-soft', 'bg-brand-glow', 'bg-chart-1'] as const;

/** Monday-first day initials (Intl, so they follow the app language). */
function weekdayInitials(locale: string): string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  // 2026-10-12 is a Monday.
  return Array.from({ length: 7 }, (_, i) => format.format(new Date(2026, 9, 12 + i)));
}

/** Attempts per day over the last 5 weeks (all exams) and the current day streak. */
export function ActivityCard() {
  const { t, i18n } = useTranslation();
  const { data: attempts, isPending } = useAttempts();
  const fallback = useThemeColor('warning');
  const flame = useCSSVariable('--color-chart-4');

  if (isPending) return <Skeleton className="h-56 rounded-3xl" />;
  if (!attempts) return null;

  const counts = countByDay(attempts.map((a) => a.startedAt));
  const today = new Date();
  const weeks = heatmapWeeks(counts, today);
  const streak = currentStreak(counts, today);

  return (
    <Card className="gap-3 border border-border">
      <View className="flex-row items-center">
        <View className="flex-1">
          <Text weight="semibold">{t('reports.activity')}</Text>
          <Text type="body-xs" color="muted">
            {t('reports.activitySub')}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Ionicons name="flame" size={16} color={typeof flame === 'string' ? flame : fallback} />
          <Text type="body-sm" weight="semibold">
            {t('reports.streak', { count: streak })}
          </Text>
        </View>
      </View>
      <View
        className="gap-1.5"
        accessible
        accessibilityLabel={t('reports.activitySummary', {
          count: weeks.flat().reduce((sum, cell) => sum + cell.count, 0),
        })}
      >
        <View className="flex-row gap-1.5">
          {weekdayInitials(i18n.language).map((day, index) => (
            <Text key={index} type="body-xs" color="muted" className="flex-1 text-center">
              {day}
            </Text>
          ))}
        </View>
        {weeks.map((week) => (
          <View key={week[0]!.key} className="flex-row gap-1.5">
            {week.map((cell) => (
              <Cell key={cell.key} cell={cell} />
            ))}
          </View>
        ))}
      </View>
      <View className="flex-row items-center justify-end gap-1">
        <Text type="body-xs" color="muted">
          {t('reports.less')}
        </Text>
        {LEVEL.map((className) => (
          <View key={className} className={`size-3 rounded ${className}`} />
        ))}
        <Text type="body-xs" color="muted">
          {t('reports.more')}
        </Text>
      </View>
    </Card>
  );
}

function Cell({ cell }: { cell: HeatCell }) {
  return (
    <View
      className={`h-7 flex-1 rounded-lg ${cell.isFuture ? 'border border-dashed border-border' : LEVEL[cell.level]}`}
    />
  );
}
