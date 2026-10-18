import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  Card,
  ChartLegend,
  Chip,
  type IconName,
  IconTile,
  type LegendItem,
  LineChart,
  type LineSeries,
  PieChart,
  Text,
  type Tone,
  useOutcomeColors,
} from '@/components/ui';

type KpiCardProps = {
  attemptCount: number;
  /** Correct + wrong over every attempt. */
  answeredCount: number;
  bestCorrectPercent: number;
  /** Average time per answer as a clock, or null when nothing was answered. */
  avgTime: string | null;
  isTimeEstimated: boolean;
};

/** 2 × 2 grid of the headline numbers under the hero card. */
export function KpiCard({
  attemptCount,
  answeredCount,
  bestCorrectPercent,
  avgTime,
  isTimeEstimated,
}: KpiCardProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-3">
      <View className="flex-row gap-3">
        <Kpi
          tone="violet"
          icon="checkmark-done"
          value={String(attemptCount)}
          label={t('reports.attempts')}
        />
        <Kpi
          tone="blue"
          icon="help-circle-outline"
          value={String(answeredCount)}
          label={t('reports.answered')}
        />
      </View>
      <View className="flex-row gap-3">
        <Kpi
          tone="orange"
          icon="timer-outline"
          value={avgTime ?? '—'}
          label={t('reports.avgTime')}
          badge={isTimeEstimated ? t('reports.estimated') : null}
        />
        <Kpi
          tone="amber"
          icon="trophy-outline"
          value={`${bestCorrectPercent}%`}
          label={t('reports.best')}
        />
      </View>
      {isTimeEstimated ? (
        <Text type="body-xs" color="muted">
          {t('reports.estimatedHint')}
        </Text>
      ) : null}
    </View>
  );
}

type KpiProps = {
  tone: Tone;
  icon: IconName;
  value: string;
  label: string;
  badge?: string | null;
};

function Kpi({ tone, icon, value, label, badge }: KpiProps) {
  return (
    <Card className="flex-1 flex-row items-center gap-3 border border-border p-3">
      <IconTile tone={tone} icon={icon} size="sm" />
      <View className="flex-1">
        <View className="flex-row flex-wrap items-center gap-1">
          <Text type="h6" numberOfLines={1}>
            {value}
          </Text>
          {badge ? (
            <Chip size="sm" variant="soft" color="warning">
              <Chip.Label>{badge}</Chip.Label>
            </Chip>
          ) : null}
        </View>
        <Text type="body-xs" color="muted" numberOfLines={2}>
          {label}
        </Text>
      </View>
    </Card>
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
    <Card className="gap-4 border border-border">
      <View>
        <Text weight="semibold">{t('reports.outcomes')}</Text>
        <Text type="body-xs" color="muted">
          {t('reports.outcomesSub', { count: total })}
        </Text>
      </View>
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
  /** Area fill under a single series. */
  area?: boolean;
  /** Names the series; only needed when there is more than one. */
  legend?: readonly LegendItem[];
  accessibilityLabel: string;
};

/** % correct per attempt (x = attempt number). */
export function TrendCard({ series, area = false, legend, accessibilityLabel }: TrendCardProps) {
  const { t } = useTranslation();
  const longest = Math.max(0, ...series.map((s) => s.values.length));

  return (
    <Card className="gap-3 border border-border">
      <View>
        <Text weight="semibold">{t('reports.trend')}</Text>
        <Text type="body-xs" color="muted">
          {t('reports.trendSub')}
        </Text>
      </View>
      <LineChart series={series} area={area} accessibilityLabel={accessibilityLabel} />
      <Text type="body-xs" color="muted" align="center">
        {longest < 2 ? t('reports.oneAttempt') : t('reports.attemptAxis')}
      </Text>
      {legend ? <ChartLegend items={legend} /> : null}
    </Card>
  );
}

type InsightsCardProps = {
  strongest: { name: string; percent: number };
  weakest: { name: string; percent: number } | null;
  slowest: { name: string; time: string } | null;
};

/** Strongest and weakest domain and where answers take longest, from the report numbers. */
export function InsightsCard({ strongest, weakest, slowest }: InsightsCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="gap-4 border border-border">
      <Text weight="semibold">{t('reports.insights')}</Text>
      <Insight
        tone="violet"
        icon="trophy-outline"
        title={t('reports.strongest', { name: strongest.name })}
        detail={t('reports.strongestDetail', { percent: strongest.percent })}
      />
      {weakest ? (
        <Insight
          tone="orange"
          icon="alert-circle-outline"
          title={t('reports.weakest', { name: weakest.name })}
          detail={t('reports.weakestDetail', { percent: weakest.percent })}
        />
      ) : null}
      {slowest ? (
        <Insight
          tone="blue"
          icon="bulb-outline"
          title={t('reports.slowest', { name: slowest.name })}
          detail={t('reports.slowestDetail', { time: slowest.time })}
        />
      ) : null}
    </Card>
  );
}

function Insight({
  tone,
  icon,
  title,
  detail,
}: {
  tone: Tone;
  icon: IconName;
  title: string;
  detail: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      <IconTile tone={tone} icon={icon} size="sm" />
      <View className="flex-1">
        <Text type="body-sm" weight="semibold">
          {title}
        </Text>
        <Text type="body-xs" color="muted">
          {detail}
        </Text>
      </View>
    </View>
  );
}
