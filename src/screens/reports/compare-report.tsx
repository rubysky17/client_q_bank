import { FlashList } from '@shopify/flash-list';
import { type ReactElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { type ExamReport, useCompareReport } from '@/api/reports';
import { EmptyView, ErrorView, Spinner, Text, useSeriesColors } from '@/components/ui';
import { formatClockMs } from '@/utils/format-duration';

import { TrendCard } from './report-cards';
import { DomainCompareRow, ExamCompareRow } from './report-rows';
import { type CompareRow, compareRows, type Selection } from './rows';

type CompareReportProps = {
  /** Compared exams with their color slots, in selection order. */
  selection: readonly Selection[];
  /** Title, mode switch and exam picker; scrolls with the report. */
  header: ReactElement;
  /** Refreshes the exam list (pull to refresh refreshes it with the report). */
  onRefresh: () => Promise<unknown>;
};

export function CompareReport({ selection, header, onRefresh }: CompareReportProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const seriesColors = useSeriesColors();
  const examIds = selection.map((s) => s.examId);
  const canCompare = examIds.length >= 2;
  const { data: reports, error, isPending, isPlaceholderData, refetch } = useCompareReport(examIds);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const slots = new Map(selection.map((s) => [s.examId, s.slot]));
  // By exam, not position: a placeholder from the previous selection may be on screen.
  const colorOf = (examId: string) => seriesColors[slots.get(examId) ?? 0] ?? seriesColors[0]!;

  const refresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([onRefresh(), canCompare ? refetch() : null]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderRow = (row: CompareRow, data: ExamReport[]) => {
    switch (row.kind) {
      case 'trend':
        return (
          <View className="pb-3">
            <TrendCard
              series={data.map((report) => ({
                key: report.examId,
                color: colorOf(report.examId),
                values: report.attempts.map((attempt) => attempt.correctPercent),
              }))}
              legend={data.map((report) => ({
                key: report.examId,
                label: report.examTitle,
                color: colorOf(report.examId),
              }))}
              accessibilityLabel={data
                .map(
                  (report) =>
                    `${report.examTitle}: ${report.attempts
                      .map((attempt, index) =>
                        t('reports.attemptValue', {
                          n: index + 1,
                          percent: attempt.correctPercent,
                        }),
                      )
                      .join(', ')}`,
                )
                .join('. ')}
            />
          </View>
        );
      case 'heading':
        return (
          <Text type="h6" className="pt-2 pb-3">
            {t(`reports.${row.title}`)}
          </Text>
        );
      case 'exam': {
        const { summary } = row.report;
        return (
          <ExamCompareRow
            title={row.report.examTitle}
            color={colorOf(row.report.examId)}
            percent={summary.avgCorrectPercent}
            attemptCount={summary.attemptCount}
            avgTime={formatClockMs(summary.avgTimePerAnswerMs)}
            isTimeEstimated={summary.timeSource === 'estimated' || summary.timeSource === 'mixed'}
            correct={summary.outcomes.correct}
            wrong={summary.outcomes.wrong}
            unanswered={summary.outcomes.unanswered}
          />
        );
      }
      case 'domain':
        return (
          <DomainCompareRow
            name={row.domain.name ?? t('reports.noDomain')}
            bars={row.domain.byExam.map((domain, index) => ({
              key: data[index]?.examId ?? String(index),
              label: data[index]?.examTitle ?? '',
              color: colorOf(data[index]?.examId ?? ''),
              percent: domain?.correctPercent ?? null,
            }))}
          />
        );
    }
  };

  return (
    <FlashList
      data={canCompare && reports ? compareRows(reports) : []}
      keyExtractor={(row) => row.key}
      getItemType={(row) => row.kind}
      extraData={isPlaceholderData}
      renderItem={({ item }) =>
        reports ? (
          // Dimmed while the previous comparison stands in for the one loading.
          <View className={isPlaceholderData ? 'opacity-50' : undefined}>
            {renderRow(item, reports)}
          </View>
        ) : null
      }
      ListHeaderComponent={header}
      ListEmptyComponent={
        !canCompare ? (
          <EmptyView message={t('reports.notEnough')} />
        ) : isPending ? (
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
