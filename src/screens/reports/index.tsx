import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_COMPARE, useReportExams } from '@/api/reports';
import { EmptyView, ErrorView, LoadingView, SegmentedControl, Text } from '@/components/ui';

import { CompareReport } from './compare-report';
import { ExamMultiPicker, ExamPicker } from './exam-picker';
import { assignSlots, type Selection } from './rows';
import { SingleReport } from './single-report';

type ReportMode = 'single' | 'multiple';

export function ReportsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: exams, error, isPending, refetch } = useReportExams();
  const [mode, setMode] = useState<ReportMode>('single');
  // null = not chosen yet: default to the most recent exam(s).
  const [pickedExamId, setPickedExamId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Selection[] | null>(null);

  if (isPending) return <LoadingView />;
  if (!exams) return <ErrorView error={error} onRetry={refetch} />;

  const title = (
    <Text type="h3" className="pb-3">
      {t('reports.title')}
    </Text>
  );

  if (exams.length === 0) {
    return (
      <View className="flex-1 px-4" style={{ paddingTop: insets.top + 12 }}>
        {title}
        <EmptyView message={t('reports.empty')} />
      </View>
    );
  }

  // Selections are derived, so they stay valid when the exam list changes.
  const listed = new Set(exams.map((exam) => exam.examId));
  const examId =
    pickedExamId !== null && listed.has(pickedExamId) ? pickedExamId : exams[0]!.examId;
  const selection = (
    picked ??
    assignSlots(
      [],
      exams.slice(0, 2).map((exam) => exam.examId),
      MAX_COMPARE,
    )
  ).filter((s) => listed.has(s.examId));

  const header = (
    <View className="gap-3 pb-4">
      {title}
      <SegmentedControl
        value={mode}
        options={[
          { value: 'single', label: t('reports.modeSingle') },
          { value: 'multiple', label: t('reports.modeMultiple') },
        ]}
        onValueChange={setMode}
      />
      {mode === 'single' ? (
        <ExamPicker exams={exams} value={examId} onChange={setPickedExamId} />
      ) : (
        <ExamMultiPicker
          exams={exams}
          value={selection.map((s) => s.examId)}
          max={MAX_COMPARE}
          onChange={(ids) => setPicked(assignSlots(selection, ids, MAX_COMPARE))}
        />
      )}
    </View>
  );

  return mode === 'single' ? (
    <SingleReport examId={examId} header={header} onRefresh={refetch} />
  ) : (
    <CompareReport selection={selection} header={header} onRefresh={refetch} />
  );
}
