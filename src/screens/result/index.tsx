import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type AttemptResult, type Tally, useAttemptResult } from '@/api/attempts';
import { Button, Card, Chip, ErrorView, LoadingView, Text } from '@/components/ui';
import { formatClock } from '@/utils/format-duration';

type Row =
  | { kind: 'heading'; key: string; title: string }
  | { kind: 'tally'; key: string; label: string; tally: Tally };

/** Breakdown tables flattened into one list: a heading row, then one row per group. */
function breakdownRows(result: AttemptResult, t: TFunction): Row[] {
  const { sections, domains, difficulties } = result.breakdown;
  return [
    { kind: 'heading', key: 'h-sections', title: t('result.bySection') },
    ...sections.map((s) => ({
      kind: 'tally' as const,
      key: `s-${s.order}`,
      label: s.title,
      tally: s,
    })),
    { kind: 'heading', key: 'h-domains', title: t('result.byDomain') },
    ...domains.map((d) => ({
      kind: 'tally' as const,
      key: `d-${d.domainId ?? 'none'}`,
      label: d.name,
      tally: d,
    })),
    { kind: 'heading', key: 'h-difficulties', title: t('result.byDifficulty') },
    ...difficulties.map((d) => ({
      kind: 'tally' as const,
      key: `x-${d.difficulty}`,
      label: t(`difficulty.${d.difficulty}`),
      tally: d,
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
            <Text type="body-sm" weight="medium" color="muted" className="pt-4 pb-2">
              {item.title}
            </Text>
          ) : (
            <TallyRow
              label={item.label}
              percent={item.tally.percent}
              detail={t('result.tally', { correct: item.tally.correct, total: item.tally.total })}
            />
          )
        }
        ListHeaderComponent={<Summary result={result} />}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16 }}
      />
      <View
        className="flex-row gap-3 border-t border-separator bg-background px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button variant="secondary" className="flex-1" onPress={() => dismissTo('/')}>
          <Button.Label>{t('result.done')}</Button.Label>
        </Button>
        <Button
          className="flex-1"
          onPress={() => push({ pathname: '/attempts/[id]/review', params: { id } })}
        >
          <Button.Label>{t('result.review')}</Button.Label>
        </Button>
      </View>
    </View>
  );
}

function Summary({ result }: { result: AttemptResult }) {
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeInDown.duration(400)} className="gap-4">
      <Text type="h4">{result.examTitle}</Text>
      <Card className="items-center gap-2 py-6">
        <Text type="h1">{`${result.percent}%`}</Text>
        <View className="flex-row gap-2">
          {result.passed === null ? null : (
            <Chip size="sm" variant="soft" color={result.passed ? 'success' : 'danger'}>
              <Chip.Label>{result.passed ? t('result.passed') : t('result.failed')}</Chip.Label>
            </Chip>
          )}
          {result.status === 'EXPIRED' ? (
            <Chip size="sm" variant="soft" color="warning">
              <Chip.Label>{t('status.EXPIRED')}</Chip.Label>
            </Chip>
          ) : null}
        </View>
        {result.passingScore === null ? null : (
          <Text type="body-sm" color="muted">
            {t('result.passMark', { percent: result.passingScore })}
          </Text>
        )}
      </Card>
      <Card className="flex-row flex-wrap gap-y-3">
        <Fact label={t('result.score')} value={`${result.score}/${result.maxScore}`} />
        <Fact
          label={t('result.correct')}
          value={`${result.correctCount}/${result.totalQuestions}`}
        />
        <Fact
          label={t('result.answered')}
          value={`${result.answeredCount}/${result.totalQuestions}`}
        />
        <Fact
          label={t('result.timeSpent')}
          value={result.timeSpentSeconds === null ? '—' : formatClock(result.timeSpentSeconds)}
        />
      </Card>
    </Animated.View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View className="w-1/2 gap-0.5">
      <Text type="body-xs" color="muted">
        {label}
      </Text>
      <Text weight="semibold">{value}</Text>
    </View>
  );
}

type TallyRowProps = {
  label: string;
  percent: number;
  detail: string;
};

function TallyRow({ label, percent, detail }: TallyRowProps) {
  return (
    <View className="gap-1.5 pb-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text weight="medium" className="flex-1" numberOfLines={1}>
          {label}
        </Text>
        <Text type="body-sm" color="muted">
          {`${detail} · ${percent}%`}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-full bg-surface-secondary">
        <View className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
      </View>
    </View>
  );
}
