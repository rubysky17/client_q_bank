import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Card, PieChart, StackedBar, Text, useOutcomeColors } from '@/components/ui';

type DomainRowProps = {
  name: string;
  total: number;
  correct: number;
  wrong: number;
  unanswered: number;
  percent: number;
  avgTime: string | null;
};

// List item: primitive props only, no data fetching.
export function DomainRow({
  name,
  total,
  correct,
  wrong,
  unanswered,
  percent,
  avgTime,
}: DomainRowProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-1.5 pb-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text weight="medium" className="flex-1" numberOfLines={1}>
          {name}
        </Text>
        <Text type="body-sm" color="muted">
          {t('reports.domainTally', { correct, total, percent })}
        </Text>
      </View>
      <StackedBar
        segments={[
          { key: 'correct', value: correct, className: 'bg-success' },
          { key: 'wrong', value: wrong, className: 'bg-danger' },
          { key: 'unanswered', value: unanswered, className: 'bg-muted' },
        ]}
      />
      {avgTime === null ? null : (
        <Text type="body-xs" color="muted">
          {t('reports.domainTime', { time: avgTime })}
        </Text>
      )}
    </View>
  );
}

type ExamCompareRowProps = {
  title: string;
  /** The exam's series color in the trend chart. */
  color: string;
  percent: number;
  attemptCount: number;
  avgTime: string | null;
  isTimeEstimated: boolean;
  correct: number;
  wrong: number;
  unanswered: number;
};

// List item: primitive props only, no data fetching.
export function ExamCompareRow({
  title,
  color,
  percent,
  attemptCount,
  avgTime,
  isTimeEstimated,
  correct,
  wrong,
  unanswered,
}: ExamCompareRowProps) {
  const { t } = useTranslation();
  const colors = useOutcomeColors();

  return (
    <Card className="mb-3 flex-row items-center gap-3">
      <View className="flex-1 gap-1">
        <View className="flex-row items-center gap-2">
          <View className="size-3 rounded-full" style={{ backgroundColor: color }} />
          <Text weight="semibold" className="flex-1" numberOfLines={2}>
            {title}
          </Text>
        </View>
        <Text type="body-sm" color="muted">
          {t('reports.examStats', { percent, count: attemptCount })}
        </Text>
        <Text type="body-sm" color="muted">
          {`${t('reports.avgTime')}: ${
            avgTime === null ? '—' : t('reports.perAnswer', { time: avgTime })
          }${isTimeEstimated ? ` (${t('reports.estimated')})` : ''}`}
        </Text>
      </View>
      <PieChart
        size={64}
        thickness={9}
        slices={[
          { key: 'correct', value: correct, color: colors.correct },
          { key: 'wrong', value: wrong, color: colors.wrong },
          { key: 'unanswered', value: unanswered, color: colors.unanswered },
        ]}
        accessibilityLabel={t('reports.outcomesSummary', { correct, wrong, unanswered })}
      >
        <Text type="body-xs" weight="semibold">{`${percent}%`}</Text>
      </PieChart>
    </Card>
  );
}

export type DomainBar = {
  key: string;
  /** Exam title, for screen readers. */
  label: string;
  color: string;
  /** null = the exam has no question in this domain. */
  percent: number | null;
};

type DomainCompareRowProps = {
  name: string;
  bars: readonly DomainBar[];
};

/** One domain: a % correct bar per compared exam, in the exams' colors. */
export function DomainCompareRow({ name, bars }: DomainCompareRowProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-2 pb-4">
      <Text weight="medium" numberOfLines={1}>
        {name}
      </Text>
      {bars.map((bar) => (
        <View
          key={bar.key}
          accessible
          accessibilityLabel={`${bar.label}: ${
            bar.percent === null ? t('reports.notCovered') : `${bar.percent}%`
          }`}
          className="flex-row items-center gap-2"
        >
          <View className="h-2 flex-1 overflow-hidden rounded-full bg-surface-secondary">
            {bar.percent === null ? null : (
              <View
                className="h-full rounded-full"
                style={{ width: `${bar.percent}%`, backgroundColor: bar.color }}
              />
            )}
          </View>
          <Text type="body-xs" color="muted" className="w-12 text-right">
            {bar.percent === null ? '—' : `${bar.percent}%`}
          </Text>
        </View>
      ))}
    </View>
  );
}
