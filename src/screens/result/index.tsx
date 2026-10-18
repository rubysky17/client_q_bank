import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type AttemptResult, type Tally, useAttemptResult } from '@/api/attempts';
import Ionicons from '@expo/vector-icons/Ionicons';

import {
  BrandHero,
  Button,
  Card,
  Chip,
  ErrorView,
  GradientButton,
  type IconName,
  IconTile,
  LoadingView,
  PressableFeedback,
  ProgressRing,
  Text,
  useThemeColor,
} from '@/components/ui';
import {
  NO_DOMAIN,
  type Outcome,
  type ReviewFilters,
  toReviewParams,
} from '@/screens/review/review-filters';
import { formatClock } from '@/utils/format-duration';

import { DecisionInsights } from './decision-insights';

type Row =
  | { kind: 'heading'; key: string; title: string }
  | {
      kind: 'tally';
      key: string;
      label: string;
      tally: Tally;
      index: number;
      /** Review filters opening the questions of this group; null when they can't be told apart. */
      filter: Partial<ReviewFilters> | null;
    };

/** Breakdown tables flattened into one list: a heading row, then one row per group. */
function breakdownRows(result: AttemptResult, t: TFunction): Row[] {
  const { sections, domains, difficulties } = result.breakdown;
  return [
    { kind: 'heading', key: 'h-sections', title: t('result.bySection') },
    ...sections.map((s, index) => ({
      kind: 'tally' as const,
      key: `s-${s.order}`,
      label: s.title,
      tally: s,
      index,
      filter: s.sectionId === null ? null : { sectionIds: [s.sectionId] },
    })),
    { kind: 'heading', key: 'h-domains', title: t('result.byDomain') },
    ...domains.map((d, index) => ({
      kind: 'tally' as const,
      key: `d-${d.domainId ?? 'none'}`,
      label: d.name,
      tally: d,
      index,
      filter: { domainIds: [d.domainId ?? NO_DOMAIN] },
    })),
    { kind: 'heading', key: 'h-difficulties', title: t('result.byDifficulty') },
    ...difficulties.map((d, index) => ({
      kind: 'tally' as const,
      key: `x-${d.difficulty}`,
      label: t(`difficulty.${d.difficulty}`),
      tally: d,
      index,
      filter: { difficulties: [d.difficulty] },
    })),
  ];
}

type ResultScreenProps = {
  id: string;
};

export function ResultScreen({ id }: ResultScreenProps) {
  const { t } = useTranslation();
  const { push, dismissTo } = useRouter();
  const insets = useSafeAreaInsets();
  const { data: result, error, isPending, refetch } = useAttemptResult(id);
  const openReview = (filter: Partial<ReviewFilters> = {}) =>
    push({ pathname: '/attempts/[id]/review', params: { id, ...toReviewParams(filter) } });

  if (isPending) return <LoadingView />;
  if (!result) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <View className="flex-1">
      <FlashList
        data={breakdownRows(result, t)}
        keyExtractor={(row) => row.key}
        getItemType={(row) => row.kind}
        renderItem={({ item }) =>
          item.kind === 'heading' ? (
            <Text type="h6" className="px-4 pt-4 pb-3">
              {item.title}
            </Text>
          ) : (
            <TallyRow
              index={item.index}
              label={item.label}
              percent={item.tally.percent}
              detail={t('result.tally', { correct: item.tally.correct, total: item.tally.total })}
              onPress={item.filter ? () => openReview(item.filter ?? {}) : undefined}
            />
          )
        }
        ListHeaderComponent={
          <Summary
            result={result}
            onBack={() => dismissTo('/')}
            onOpenOutcome={(outcome) => openReview({ outcomes: [outcome] })}
          />
        }
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <View
        className="flex-row gap-3 border-t border-border bg-background px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button variant="secondary" className="flex-1" onPress={() => dismissTo('/')}>
          <Button.Label>{t('result.done')}</Button.Label>
        </Button>
        <GradientButton
          className="flex-1"
          label={t('result.review')}
          onPress={() => openReview()}
        />
      </View>
    </View>
  );
}

type SummaryProps = {
  result: AttemptResult;
  onBack: () => void;
  onOpenOutcome: (outcome: Outcome) => void;
};

function Summary({ result, onBack, onOpenOutcome }: SummaryProps) {
  const { t } = useTranslation();
  const wrong = Math.max(0, result.answeredCount - result.correctCount);
  const unanswered = Math.max(0, result.totalQuestions - result.answeredCount);
  const perQuestion =
    result.timeSpentSeconds === null || result.answeredCount === 0
      ? null
      : formatClock(result.timeSpentSeconds / result.answeredCount);

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="gap-4">
      <BrandHero onBack={onBack} title={t('result.title')} className="items-center">
        <Text type="body-sm" className="text-center text-on-brand-muted" numberOfLines={2}>
          {result.examTitle}
        </Text>
        <ProgressRing percent={result.percent} size={148} thickness={12} variant="on-brand">
          <Text type="h1" className="font-bold text-on-brand">{`${result.percent}%`}</Text>
          <Text type="body-xs" className="text-on-brand-muted">
            {t('result.scoreOf', { score: result.score, max: result.maxScore })}
          </Text>
        </ProgressRing>
        <View className="flex-row flex-wrap justify-center gap-2">
          {result.passed === null ? null : (
            <View className="rounded-full bg-on-brand px-3 py-1">
              <Text
                type="body-sm"
                weight="semibold"
                className={
                  result.passed ? 'text-success-soft-foreground' : 'text-danger-soft-foreground'
                }
              >
                {result.passed ? t('result.passed') : t('result.failed')}
              </Text>
            </View>
          )}
          {result.status === 'EXPIRED' || result.status === 'ABANDONED' ? (
            <Chip size="sm" variant="soft" color="warning">
              <Chip.Label>{t(`status.${result.status}`)}</Chip.Label>
            </Chip>
          ) : null}
        </View>
        {result.passingScore === null ? null : (
          <Text type="body-sm" className="text-center text-on-brand-muted">
            {t('result.passMark', { percent: result.passingScore })}
          </Text>
        )}
      </BrandHero>

      <View className="gap-3 px-4">
        <View className="flex-row gap-2">
          <OutcomeCard
            icon="checkmark-circle"
            tone="success"
            value={result.correctCount}
            label={t('result.correct')}
            onPress={() => onOpenOutcome('correct')}
          />
          <OutcomeCard
            icon="close-circle"
            tone="danger"
            value={wrong}
            label={t('result.wrong')}
            onPress={() => onOpenOutcome('wrong')}
          />
          <OutcomeCard
            icon="help-circle-outline"
            tone="muted"
            value={unanswered}
            label={t('result.skipped')}
            onPress={() => onOpenOutcome('notAnswered')}
          />
        </View>
        <Card className="flex-row gap-3 border border-border">
          <TimeFact
            icon="timer-outline"
            value={result.timeSpentSeconds === null ? '—' : formatClock(result.timeSpentSeconds)}
            label={t('result.timeSpent')}
          />
          <TimeFact
            icon="speedometer-outline"
            value={perQuestion ?? '—'}
            label={t('result.perQuestion')}
          />
        </Card>
        {result.mode === 'SECTIONED' ? <DecisionInsights result={result} /> : null}
      </View>
    </Animated.View>
  );
}

type OutcomeCardProps = {
  icon: IconName;
  tone: 'success' | 'danger' | 'muted';
  value: number;
  label: string;
  onPress: () => void;
};

/** Count of one outcome; opens the review of those questions (none to show → not pressable). */
function OutcomeCard({ icon, tone, value, label, onPress }: OutcomeCardProps) {
  const color = useThemeColor(tone);
  return (
    <PressableFeedback
      onPress={onPress}
      isDisabled={value === 0}
      accessibilityRole="button"
      className="flex-1"
    >
      <Card className="items-center gap-1 border border-border px-2 py-3">
        <Ionicons name={icon} size={20} color={color} />
        <Text type="h4">{String(value)}</Text>
        <Text type="body-xs" color="muted" numberOfLines={1}>
          {label}
        </Text>
      </Card>
    </PressableFeedback>
  );
}

function TimeFact({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View className="flex-1 flex-row items-center gap-2.5">
      <IconTile tone={icon === 'timer-outline' ? 'blue' : 'violet'} icon={icon} size="sm" />
      <View className="flex-1">
        <Text weight="semibold" numberOfLines={1}>
          {value}
        </Text>
        <Text type="body-xs" color="muted" numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

/** Bar colors cycle through the series palette (green/red stay for correct/wrong). */
const BAR_COLORS = ['bg-chart-1', 'bg-chart-3', 'bg-chart-2', 'bg-chart-5', 'bg-chart-4'] as const;

type TallyRowProps = {
  index: number;
  label: string;
  percent: number;
  detail: string;
  /** Opens the review of this group's questions. */
  onPress?: () => void;
};

function TallyRow({ index, label, percent, detail, onPress }: TallyRowProps) {
  const muted = useThemeColor('muted');
  return (
    <PressableFeedback
      onPress={onPress}
      isDisabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className="gap-1.5 px-4 pb-3"
    >
      <View className="flex-row items-center justify-between gap-3">
        <Text weight="medium" className="flex-1" numberOfLines={1}>
          {label}
        </Text>
        <Text type="body-sm" color="muted">
          {`${detail} · ${percent}%`}
        </Text>
        {onPress ? <Ionicons name="chevron-forward" size={14} color={muted} /> : null}
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-surface-secondary">
        <View
          className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
          style={{ width: `${percent}%` }}
        />
      </View>
    </PressableFeedback>
  );
}
