import { FlashList } from '@shopify/flash-list';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type ExamReport, useExamReport } from '@/api/reports';
import { ErrorView, Spinner, Text, useThemeColor } from '@/components/ui';
import { formatClockMs } from '@/utils/format-duration';

import { KpiCard, OutcomesCard, TrendCard } from './report-cards';
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
      case 'kpis':
        return (
          <KpiCard
            avgCorrectPercent={summary.avgCorrectPercent}
            latestCorrectPercent={summary.latestCorrectPercent}
            bestCorrectPercent={summary.bestCorrectPercent}
            attemptCount={summary.attemptCount}
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
            series={[{ key: data.examId, color: accent, values }]}
            accessibilityLabel={values
              .map((percent, index) => t('reports.attemptValue', { n: index + 1, percent }))
              .join(', ')}
          />
        );
      }
      case 'heading':
        return (
          <Text type="body-sm" weight="medium" color="muted" className="pt-2 pb-3">
            {t(`reports.${row.title}`)}
          </Text>
        );
      case 'domain':
        return (
          <DomainRow
            name={row.domain.name ?? t('reports.noDomain')}
            total={row.domain.total}
            correct={row.domain.correct}
            wrong={row.domain.wrong}
            unanswered={row.domain.unanswered}
            percent={row.domain.correctPercent}
            avgTime={formatClockMs(row.domain.avgTimePerAnswerMs)}
          />
        );
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
