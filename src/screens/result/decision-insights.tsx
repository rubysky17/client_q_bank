import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { type AttemptResult, useAttemptReview } from '@/api/attempts';
import { Card, Skeleton, Text } from '@/components/ui';
import { formatClockMs } from '@/utils/format-duration';

import { decisionInsights, GUESS_UNDER_MS } from './insights';

/** Sectioned attempts: what the decision trace says (confidence, guesses, crossing out, pacing). */
export function DecisionInsights({ result }: { result: AttemptResult }) {
  const { t } = useTranslation();
  const { data: review, isPending } = useAttemptReview(result.attemptId);

  if (isPending) return <Skeleton className="h-40 rounded-3xl" />;
  if (!review) return null;

  const insight = decisionInsights(review.questions, result);
  const { confidence: c } = insight;
  const quadrants = [
    {
      key: 'mastered',
      count: c.HIGH.correct + c.MEDIUM.correct,
      title: t('insights.mastered'),
      hint: t('insights.masteredHint'),
      tone: 'text-success',
    },
    {
      key: 'misconception',
      count: c.HIGH.wrong,
      title: t('insights.misconception'),
      hint: t('insights.misconceptionHint'),
      tone: 'text-danger',
    },
    {
      key: 'lucky',
      count: c.LOW.correct,
      title: t('insights.lucky'),
      hint: t('insights.luckyHint'),
      tone: 'text-warning',
    },
    {
      key: 'gap',
      count: c.LOW.wrong + c.MEDIUM.wrong,
      title: t('insights.gap'),
      hint: t('insights.gapHint'),
      tone: 'text-danger',
    },
  ];
  const unrated = c.NONE.correct + c.NONE.wrong;
  const { elimination: e, changes, flags } = insight;

  return (
    <View className="gap-3 pt-2">
      <Text type="body-sm" weight="medium" color="muted">
        {t('insights.title')}
      </Text>

      <Card className="gap-3">
        <Text weight="semibold">{t('insights.confidenceTitle')}</Text>
        <View className="flex-row flex-wrap gap-y-3">
          {quadrants.map((q) => (
            <View key={q.key} className="w-1/2 gap-0.5 pr-2">
              <Text type="h4" className={q.tone}>
                {String(q.count)}
              </Text>
              <Text type="body-sm" weight="medium">
                {q.title}
              </Text>
              <Text type="body-xs" color="muted">
                {q.hint}
              </Text>
            </View>
          ))}
        </View>
        {unrated > 0 ? (
          <Text type="body-xs" color="muted">
            {t('insights.noConfidence', { count: unrated })}
          </Text>
        ) : null}
      </Card>

      <InsightCard
        title={t('insights.guessTitle')}
        lines={[
          t('insights.guessDetail', {
            count: insight.guesses.count,
            correct: insight.guesses.correct,
            seconds: GUESS_UNDER_MS / 1000,
          }),
        ]}
      />

      {e.total > 0 ? (
        <InsightCard
          title={t('insights.eliminationTitle')}
          lines={[
            t('insights.eliminationDetail', {
              total: e.total,
              percent: Math.round((e.wrongOptions / e.total) * 100),
            }),
            e.correctEliminated > 0
              ? t('insights.eliminatedCorrect', { count: e.correctEliminated })
              : null,
          ]}
        />
      ) : null}

      {changes.wrongToRight + changes.rightToWrong + changes.wrongToWrong > 0 ? (
        <InsightCard
          title={t('insights.changesTitle')}
          lines={[t('insights.changesDetail', changes)]}
        />
      ) : null}

      <InsightCard
        title={t('insights.pacingTitle')}
        lines={[
          ...insight.sections.flatMap((s) => [
            t('insights.sectionPace', {
              title: s.title,
              used: formatClockMs(s.usedMs) ?? '',
              budget: formatClockMs(s.budgetMs) ?? '',
              avg: formatClockMs(s.avgAnswerMs) ?? '—',
            }),
            s.breakSkipped
              ? t('insights.breakSkipped')
              : s.breakTakenMs
                ? t('insights.breakTaken', { time: formatClockMs(s.breakTakenMs) ?? '' })
                : null,
          ]),
          insight.slowest.length > 0
            ? t('insights.slowest', {
                items: insight.slowest
                  .map((q) => `#${q.order} (${formatClockMs(q.dwellMs) ?? ''})`)
                  .join(', '),
              })
            : null,
        ]}
      />

      {flags.total > 0 ? (
        <InsightCard title={t('insights.flagsTitle')} lines={[t('insights.flagsDetail', flags)]} />
      ) : null}
    </View>
  );
}

function InsightCard({ title, lines }: { title: string; lines: (string | null)[] }) {
  return (
    <Card className="gap-1.5">
      <Text weight="semibold">{title}</Text>
      {lines.map((line, index) =>
        line === null ? null : (
          <Text key={index} type="body-sm" color="muted" className="leading-5">
            {line}
          </Text>
        ),
      )}
    </Card>
  );
}
