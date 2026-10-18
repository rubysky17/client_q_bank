import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Card,
  ChartLegend,
  Chip,
  type LegendItem,
  LineChart,
  type LineSeries,
  PieChart,
  Text,
  useOutcomeColors,
} from '@/components/ui';

type KpiCardProps = {
  avgCorrectPercent: number;
  latestCorrectPercent: number;
  bestCorrectPercent: number;
  attemptCount: number;
  /** Average time per answer as a clock, or null when nothing was answered. */
  avgTime: string | null;
  isTimeEstimated: boolean;
};

export function KpiCard({
  avgCorrectPercent,
  latestCorrectPercent,
  bestCorrectPercent,
  attemptCount,
  avgTime,
  isTimeEstimated,
}: KpiCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Text type="body-sm" color="muted">
          {t('reports.avgCorrect')}
        </Text>
        <Text type="h1">{`${avgCorrectPercent}%`}</Text>
      </View>
      <View className="flex-row flex-wrap gap-y-3">
        <Fact label={t('reports.latest')} value={`${latestCorrectPercent}%`} />
        <Fact label={t('reports.best')} value={`${bestCorrectPercent}%`} />
        <Fact label={t('reports.attempts')} value={String(attemptCount)} />
        <Fact
          label={t('reports.avgTime')}
          value={avgTime === null ? '—' : t('reports.perAnswer', { time: avgTime })}
          badge={isTimeEstimated ? t('reports.estimated') : null}
        />
      </View>
      {isTimeEstimated ? (
        <Text type="body-xs" color="muted">
          {t('reports.estimatedHint')}
        </Text>
      ) : null}
    </Card>
  );
}

function Fact({ label, value, badge }: { label: string; value: string; badge?: string | null }) {
  return (
    <View className="w-1/2 gap-0.5 pr-2">
      <Text type="body-xs" color="muted">
        {label}
      </Text>
      <View className="flex-row flex-wrap items-center gap-1.5">
        <Text weight="semibold">{value}</Text>
        {badge ? (
          <Chip size="sm" variant="soft" color="warning">
            <Chip.Label>{badge}</Chip.Label>
          </Chip>
        ) : null}
      </View>
    </View>
  );
}

type OutcomesCardProps = {
  correct: number;
  wrong: number;
  unanswered: number;
};

/** Donut of correct / wrong / unanswered answers over every attempt. */
export function OutcomesCard({ correct, wrong, unanswered }: OutcomesCardProps) {
  const { t } = useTranslation();
  const colors = useOutcomeColors();
  const total = correct + wrong + unanswered;
  const percent = (count: number) => (total > 0 ? Math.round((count / total) * 100) : 0);
  const outcomes = [
    { key: 'correct', label: t('reports.correct'), color: colors.correct, count: correct },
    { key: 'wrong', label: t('reports.wrong'), color: colors.wrong, count: wrong },
    {
      key: 'unanswered',
      label: t('reports.unanswered'),
      color: colors.unanswered,
      count: unanswered,
    },
  ];

  return (
    <Card className="gap-4">
      <Text weight="semibold">{t('reports.outcomes')}</Text>
      <View className="flex-row items-center gap-5">
        <PieChart
          size={132}
          thickness={16}
          slices={outcomes.map(({ key, count, color }) => ({ key, value: count, color }))}
          accessibilityLabel={t('reports.outcomesSummary', { correct, wrong, unanswered })}
        >
          <Text type="h4">{`${percent(correct)}%`}</Text>
          <Text type="body-xs" color="muted">
            {t('reports.correctCaption')}
          </Text>
        </PieChart>
        <ChartLegend
          className="flex-1"
          items={outcomes.map(({ key, label, color, count }) => ({
            key,
            label,
            color,
            value: t('reports.outcomeValue', { count, percent: percent(count) }),
          }))}
        />
      </View>
    </Card>
  );
}

type TrendCardProps = {
  series: readonly LineSeries[];
  /** Names the series; only needed when there is more than one. */
  legend?: readonly LegendItem[];
  accessibilityLabel: string;
};

/** % correct per attempt (x = attempt number). */
export function TrendCard({ series, legend, accessibilityLabel }: TrendCardProps) {
  const { t } = useTranslation();
  const longest = Math.max(0, ...series.map((s) => s.values.length));

  return (
    <Card className="gap-3">
      <Text weight="semibold">{t('reports.trend')}</Text>
      <LineChart series={series} accessibilityLabel={accessibilityLabel} />
      <Text type="body-xs" color="muted" align="center">
        {longest < 2 ? t('reports.oneAttempt') : t('reports.attemptAxis')}
      </Text>
      {legend ? <ChartLegend items={legend} /> : null}
    </Card>
  );
}
