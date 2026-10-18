import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { catalogExamQueryOptions } from '@/api/catalog';
import { type ExamReport, useExamReport } from '@/api/reports';
import { ErrorView, Spinner, Text, useThemeColor } from '@/components/ui';
import { formatClockMs } from '@/utils/format-duration';

import { ActivityCard } from './activity-card';
import { InsightsCard, KpiCard, OutcomesCard, TrendCard } from './report-cards';
import { ReportHero } from './report-hero';
import { DomainRow } from './report-rows';
import { type SingleRow, singleRows } from './rows';

type SingleReportProps = {
  examId: string;
  /** Title, mode switch and exam picker; scrolls with the report. */
  header: ReactElement;
  /** Refreshes the exam list (pull to refresh refreshes it with the report). */
  onRefresh: () => Promise<unknown>;
};

export function SingleReport({ examId, header, onRefresh }: SingleReportProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const accent = useThemeColor('accent');
  const { data: report, error, isPending, isPlaceholderData, refetch } = useExamReport(examId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // For the pass-mark tick on the domain bars (usually cached from the exam screen).
  const { data: exam } = useQuery(catalogExamQueryOptions(examId));
  const passingScore = exam?.passingScore ?? null;

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([onRefresh(), refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderRow = (row: SingleRow, data: ExamReport) => {
    const { summary } = data;
    switch (row.kind) {
      case 'hero':
        return (
          <ReportHero
            avgCorrectPercent={summary.avgCorrectPercent}
            values={data.attempts.map((attempt) => attempt.correctPercent)}
          />
        );
      case 'kpis':
        return (
          <KpiCard
            attemptCount={summary.attemptCount}
            answeredCount={summary.outcomes.correct + summary.outcomes.wrong}
            bestCorrectPercent={summary.bestCorrectPercent}
            avgTime={formatClockMs(summary.avgTimePerAnswerMs)}
            isTimeEstimated={summary.timeSource === 'estimated' || summary.timeSource === 'mixed'}
          />
        );
      case 'outcomes':
        return (
          <OutcomesCard
            correct={summary.outcomes.correct}
            wrong={summary.outcomes.wrong}
            unanswered={summary.outcomes.unanswered}
          />
        );
      case 'trend': {
        const values = data.attempts.map((attempt) => attempt.correctPercent);
        return (
          <TrendCard
            area
            series={[{ key: data.examId, color: accent, values }]}
            accessibilityLabel={values
              .map((percent, index) => t('reports.attemptValue', { n: index + 1, percent }))
              .join(', ')}
          />
        );
      }
      case 'heading':
        return (
          <Text type="h6" className="pt-2 pb-3">
            {t(`reports.${row.title}`)}
          </Text>
        );
      case 'domain':
        return (
          <DomainRow
            name={row.domain.name ?? t('reports.noDomain')}
            total={row.domain.total}
            correct={row.domain.correct}
            percent={row.domain.correctPercent}
            avgTime={formatClockMs(row.domain.avgTimePerAnswerMs)}
            index={row.index}
            passingScore={passingScore}
          />
        );
      case 'activity':
        return <ActivityCard />;
      case 'insights': {
        const { strongest, weakest, slowest } = row.insights;
        return (
          <InsightsCard
            strongest={{ name: strongest.name ?? '', percent: strongest.correctPercent }}
            weakest={weakest ? { name: weakest.name ?? '', percent: weakest.correctPercent } : null}
            slowest={
              slowest
                ? {
                    name: slowest.name ?? '',
                    time: formatClockMs(slowest.avgTimePerAnswerMs) ?? '',
                  }
                : null
            }
          />
        );
      }
    }
  };

  return (
    <FlashList
      data={report ? singleRows(report) : []}
      keyExtractor={(row) => row.key}
      getItemType={(row) => row.kind}
      extraData={isPlaceholderData}
      renderItem={({ item }) =>
        report ? (
          // Dimmed while the previous exam's report stands in for the one loading.
          <View className={isPlaceholderData ? 'opacity-50' : undefined}>
            {item.kind === 'heading' || item.kind === 'domain' ? (
              renderRow(item, report)
            ) : (
              <View className="pb-3">{renderRow(item, report)}</View>
            )}
          </View>
        ) : null
      }
      ListHeaderComponent={header}
      ListEmptyComponent={
        isPending ? (
          <Spinner className="my-10 self-center" />
        ) : (
          <ErrorView error={error} onRetry={refetch} />
        )
      }
      refreshing={isRefreshing}
      onRefresh={refresh}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
        paddingBottom: 24,
      }}
    />
  );
}
