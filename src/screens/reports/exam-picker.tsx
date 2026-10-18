import { useBottomSheetScrollableCreator } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { ReportExam } from '@/api/reports';
import { IconTile, Select, Text } from '@/components/ui';

const toOption = (exam: ReportExam) => ({ value: exam.examId, label: exam.examTitle });

const NONE: ReadonlySet<string> = new Set();

type ExamPickerProps = {
  exams: readonly ReportExam[];
  value: string;
  onChange: (examId: string) => void;
};

/** Picks the exam of the single report. */
export function ExamPicker({ exams, value, onChange }: ExamPickerProps) {
  const { t } = useTranslation();
  const selected = exams.find((exam) => exam.examId === value);

  return (
    <Select
      presentation="bottom-sheet"
      value={selected ? toOption(selected) : undefined}
      onValueChange={(option) => {
        if (option) onChange(option.value);
      }}
    >
      <PickerTrigger placeholder={t('reports.pickExam')} />
      <PickerSheet title={t('reports.pickExam')} exams={exams} lockedIds={NONE} />
    </Select>
  );
}

type ExamMultiPickerProps = {
  exams: readonly ReportExam[];
  /** Selected exam ids, in selection order. */
  value: readonly string[];
  max: number;
  onChange: (examIds: string[]) => void;
};

/** Picks 2…max exams to compare. */
export function ExamMultiPicker({ exams, value, max, onChange }: ExamMultiPickerProps) {
  const { t } = useTranslation();
  const byId = new Map(exams.map((exam) => [exam.examId, exam]));
  const selected = value.flatMap((id) => {
    const exam = byId.get(id);
    return exam ? [toOption(exam)] : [];
  });
  const hint =
    value.length < 2
      ? t('reports.pickMore', { count: 2 - value.length })
      : value.length >= max
        ? t('reports.maxReached', { max })
        : null;

  return (
    <View className="gap-1.5">
      <Select
        selectionMode="multiple"
        presentation="bottom-sheet"
        value={selected}
        onValueChange={(options) =>
          onChange(options.flatMap((option) => (option ? [option.value] : [])).slice(0, max))
        }
      >
        <PickerTrigger placeholder={t('reports.pickExams')} />
        <PickerSheet
          title={t('reports.selectedCount', { count: value.length, max })}
          exams={exams}
          // At the limit, only already selected exams can still be toggled.
          lockedIds={
            value.length >= max
              ? new Set(exams.flatMap((exam) => (value.includes(exam.examId) ? [] : [exam.examId])))
              : NONE
          }
        />
      </Select>
      {hint === null ? null : (
        <Text type="body-xs" color="muted">
          {hint}
        </Text>
      )}
    </View>
  );
}

function PickerTrigger({ placeholder }: { placeholder: string }) {
  return (
    <Select.Trigger className="h-14 gap-3 rounded-3xl border border-border bg-surface px-3">
      <IconTile tone="blue" icon="document-text-outline" size="sm" />
      <Select.Value placeholder={placeholder} numberOfLines={1} className="flex-1 font-semibold" />
      <Select.TriggerIndicator />
    </Select.Trigger>
  );
}

type PickerSheetProps = {
  title: string;
  exams: readonly ReportExam[];
  /** Exams that can't be picked right now. */
  lockedIds: ReadonlySet<string>;
};

function PickerSheet({ title, exams, lockedIds }: PickerSheetProps) {
  return (
    <Select.Portal>
      <Select.Overlay />
      {/* Fixed height + no dynamic sizing, so the list scrolls inside the sheet. */}
      <Select.Content
        presentation="bottom-sheet"
        snapPoints={['60%']}
        enableOverDrag={false}
        enableDynamicSizing={false}
        contentContainerClassName="h-full"
      >
        <Select.ListLabel className="pb-2">{title}</Select.ListLabel>
        <ExamOptions exams={exams} lockedIds={lockedIds} />
      </Select.Content>
    </Select.Portal>
  );
}

function ExamOptions({ exams, lockedIds }: Omit<PickerSheetProps, 'title'>) {
  const { t, i18n } = useTranslation();
  const renderScrollComponent = useBottomSheetScrollableCreator();
  const dateFormat = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' });

  return (
    <FlashList
      data={exams}
      keyExtractor={(exam) => exam.examId}
      extraData={lockedIds}
      renderScrollComponent={renderScrollComponent}
      renderItem={({ item }) => (
        <ExamOption
          examId={item.examId}
          title={item.examTitle}
          detail={`${t('reports.attemptCount', { count: item.attemptCount })} · ${dateFormat.format(new Date(item.lastAttemptAt))}`}
          isDisabled={lockedIds.has(item.examId)}
        />
      )}
    />
  );
}

type ExamOptionProps = {
  examId: string;
  title: string;
  detail: string;
  isDisabled: boolean;
};

// List item: primitive props only. Selection state comes from the Select itself.
function ExamOption({ examId, title, detail, isDisabled }: ExamOptionProps) {
  return (
    <Select.Item value={examId} label={title} disabled={isDisabled}>
      <View className={isDisabled ? 'flex-1 opacity-40' : 'flex-1'}>
        <Select.ItemLabel />
        <Select.ItemDescription>{detail}</Select.ItemDescription>
      </View>
      <Select.ItemIndicator />
    </Select.Item>
  );
}
