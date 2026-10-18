import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { syncAttempt } from '@/api/attempt-sync';
import { type CatalogExamDetail, useCatalogExam, useStartAttempt } from '@/api/catalog';
import { describeError } from '@/api/errors';
import { useReportExams } from '@/api/reports';
import type { LocalAttemptSummary } from '@/attempt-engine/local-store';
import {
  BrandHero,
  Button,
  Card,
  Chip,
  ErrorView,
  GradientButton,
  IconTile,
  LoadingView,
  ProgressRing,
  Spinner,
  StackedBar,
  Text,
  type Tone,
  TONES,
} from '@/components/ui';
import { toParams } from '@/screens/bank/filters';
import {
  dispatchAttempt,
  useLocalAttemptForExam,
  useLocalAttempts,
} from '@/stores/attempt-sessions';
import { formatClockMs } from '@/utils/format-duration';

type ExamDetailScreenProps = {
  id: string;
};

export function ExamDetailScreen({ id }: ExamDetailScreenProps) {
  const { t } = useTranslation();
  const { push, back } = useRouter();
  const insets = useSafeAreaInsets();
  const { data: exam, error, isPending, refetch } = useCatalogExam(id);
  const { mutate: start, isPending: isStarting, error: startError } = useStartAttempt(id);
  // The device copy comes first: it is up to date even offline.
  const local = useLocalAttemptForExam(id);
  const localAttempts = useLocalAttempts();
  const [isResetting, setIsResetting] = useState(false);
  const { data: reportExams } = useReportExams();

  if (isPending) return <LoadingView />;
  if (!exam) return <ErrorView error={error} onRetry={refetch} />;
  const avgCorrect = reportExams?.find((r) => r.examId === id)?.avgCorrectPercent ?? null;

  // An attempt abandoned on the device but not uploaded yet is no longer "in progress".
  const serverInProgress = localAttempts.some(
    (a) => a.attemptId === exam.inProgressAttemptId && a.closing !== null,
  )
    ? null
    : exam.inProgressAttemptId;
  const inProgressId = local?.attemptId ?? serverInProgress;

  const openAttempt = (attemptId: string) =>
    push({ pathname: '/attempts/[id]', params: { id: attemptId } });

  const onStart = () => {
    if (inProgressId) {
      openAttempt(inProgressId);
      return;
    }
    start(undefined, { onSuccess: (attempt) => openAttempt(attempt.id) });
  };

  /** Keeps the current attempt as Unfinished (uploaded first, so offline answers are not lost). */
  const startOver = async () => {
    setIsResetting(true);
    try {
      if (local) {
        dispatchAttempt(local.attemptId, { type: 'ATTEMPT_ABANDON' });
        const outcome = await syncAttempt(local.attemptId);
        if (outcome === 'OFFLINE') {
          Alert.alert(t('exam.startOver'), t('exam.needOnline'));
          return;
        }
      }
      start({ fresh: true }, { onSuccess: (attempt) => openAttempt(attempt.id) });
    } finally {
      setIsResetting(false);
    }
  };

  const confirmStartOver = () =>
    Alert.alert(t('exam.startOverTitle'), t('exam.startOverMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('exam.startOver'), style: 'destructive', onPress: () => void startOver() },
    ]);

  return (
    <View className="flex-1">
      <FlashList
        data={exam.sections}
        keyExtractor={(section) => section.id}
        renderItem={({ item }) => (
          <SectionRow
            order={item.order}
            tone={TONES[(item.order - 1) % TONES.length]!}
            title={item.title}
            instructions={item.instructions}
            questionsLabel={t('exam.sectionQuestions', { count: item.questionCount })}
          />
        )}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={<ExamSummary exam={exam} avgCorrect={avgCorrect} onBack={back} />}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
      <View
        className="gap-2 border-t border-border bg-background px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {startError ? (
          <Text type="body-sm" className="text-danger">
            {describeError(startError, t)}
          </Text>
        ) : null}
        {inProgressId ? (
          <>
            <InProgressCard local={local} />
            <View className="flex-row gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onPress={confirmStartOver}
                isDisabled={isStarting || isResetting}
              >
                {isResetting || isStarting ? <Spinner size="sm" /> : null}
                <Button.Label>{t('exam.startOver')}</Button.Label>
              </Button>
              <GradientButton
                className="flex-1"
                label={t('exam.continue')}
                icon="play"
                onPress={onStart}
                isDisabled={isResetting}
              />
            </View>
          </>
        ) : (
          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              onPress={() => push({ pathname: '/practice', params: toParams({ examId: exam.id }) })}
            >
              <Button.Label>{t('exam.practiceShort')}</Button.Label>
            </Button>
            <GradientButton
              className="flex-1"
              label={t('exam.start')}
              icon="play"
              onPress={onStart}
              isLoading={isStarting}
            />
          </View>
        )}
      </View>
    </View>
  );
}

type ExamSummaryProps = {
  exam: CatalogExamDetail;
  /** The user's average % correct on this exam; null = not finished yet. */
  avgCorrect: number | null;
  onBack: () => void;
};

const DIFFICULTY_BAR = {
  EASY: 'bg-success',
  MEDIUM: 'bg-chart-4',
  HARD: 'bg-danger',
  EXPERT: 'bg-chart-3',
} as const;

function ExamSummary({ exam, avgCorrect, onBack }: ExamSummaryProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-4 pb-4">
      <BrandHero
        onBack={onBack}
        accessory={
          <View className="rounded-full bg-on-brand-subtle px-3 py-1.5">
            <Text type="body-sm" weight="semibold" className="text-on-brand" numberOfLines={1}>
              {exam.topic.name}
            </Text>
          </View>
        }
      >
        <View className="gap-1">
          <Text type="h3" className="text-on-brand">
            {exam.title}
          </Text>
          <Text type="body-sm" className="text-on-brand-muted">
            {t('exam.by', { name: exam.owner.fullName })}
          </Text>
          {isSectioned(exam) ? (
            <Text type="body-sm" className="text-on-brand-muted">
              {durationLabel(exam, t)}
            </Text>
          ) : null}
        </View>
        <View className="flex-row gap-2">
          <HeroFact value={String(exam.questionCount)} label={t('exam.questions')} />
          <HeroFact value={totalDuration(exam, t)} label={t('exam.duration')} />
          <HeroFact
            value={exam.passingScore === null ? t('exam.noPassMark') : `${exam.passingScore}%`}
            label={t('exam.passMark')}
          />
        </View>
      </BrandHero>

      <View className="gap-4 px-4">
        {avgCorrect === null ? null : (
          <Card className="flex-row items-center gap-4 border border-border">
            <ProgressRing percent={avgCorrect} size={64} thickness={7}>
              <Text type="body-sm" weight="semibold">{`${avgCorrect}%`}</Text>
            </ProgressRing>
            <View className="flex-1 gap-0.5">
              <Text type="body-xs" color="muted">
                {t('exam.yourProgress')}
              </Text>
              <Text type="h6">{t('exam.avgCorrect', { percent: avgCorrect })}</Text>
              <Text type="body-xs" color="muted">
                {t('exam.myAttempts', { count: exam.myAttemptCount })}
              </Text>
            </View>
          </Card>
        )}

        {exam.description ? <Text className="leading-6">{exam.description}</Text> : null}

        {exam.breakdown.difficulties.length > 0 ? (
          <Card className="gap-3 border border-border">
            <Text type="body-sm" weight="medium" color="muted">
              {t('exam.byDifficulty')}
            </Text>
            <StackedBar
              className="h-2.5"
              segments={exam.breakdown.difficulties.map((d) => ({
                key: d.difficulty,
                value: d.questionCount,
                className: DIFFICULTY_BAR[d.difficulty],
              }))}
            />
            <View className="flex-row flex-wrap gap-x-4 gap-y-2">
              {exam.breakdown.difficulties.map((d) => (
                <View key={d.difficulty} className="flex-row items-center gap-1.5">
                  <View className={`size-2 rounded-full ${DIFFICULTY_BAR[d.difficulty]}`} />
                  <Text type="body-xs" weight="medium">
                    {`${t(`difficulty.${d.difficulty}`)} ${d.questionCount}`}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}

        {exam.breakdown.domains.length > 0 ? (
          <Mix
            title={t('exam.byDomain')}
            items={exam.breakdown.domains.map((d) => ({
              key: d.domainId ?? 'none',
              label: `${d.name} · ${d.questionCount}`,
            }))}
          />
        ) : null}

        <Text type="h6" className="pt-1">
          {t('exam.structure')}
        </Text>
      </View>
    </View>
  );
}

/** Glassy fact box on the hero. */
function HeroFact({ value, label }: { value: string; label: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-2xl bg-on-brand-subtle p-3">
      <Text type="h6" className="text-on-brand" numberOfLines={2}>
        {value}
      </Text>
      <Text type="body-xs" className="text-on-brand-muted" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Every section has its own time limit: the exam is taken section by section. */
const isSectioned = (exam: CatalogExamDetail) =>
  exam.sections.length > 0 && exam.sections.every((s) => s.durationMinutes != null);

/** Total working time, short enough for a fact box ("180 min", "Untimed"). */
function totalDuration(exam: CatalogExamDetail, t: TFunction) {
  const minutes = isSectioned(exam)
    ? exam.sections.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0)
    : exam.durationMinutes;
  return minutes === null ? t('home.untimed') : t('home.minutes', { count: minutes });
}

/** "3 sections × 60 min, 10-min break" for sectioned exams, else the total time. */
function durationLabel(exam: CatalogExamDetail, t: TFunction) {
  const minutes = exam.sections.map((s) => s.durationMinutes);
  const [first] = minutes;
  if (first != null && minutes.every((m) => m === first)) {
    const format = t('exam.sectionedFormat', { sections: minutes.length, minutes: first });
    return exam.breakMinutes === null
      ? format
      : `${format}, ${t('exam.breakFormat', { count: exam.breakMinutes })}`;
  }
  return exam.durationMinutes === null
    ? t('home.untimed')
    : t('home.minutes', { count: exam.durationMinutes });
}

/** "You have an unfinished attempt": section, progress and time left when the device has it. */
function InProgressCard({ local }: { local: LocalAttemptSummary | null }) {
  const { t } = useTranslation();
  return (
    <Card className="gap-1 border border-border bg-accent-soft">
      <Text weight="semibold">{t('exam.inProgressTitle')}</Text>
      <Text type="body-sm" color="muted">
        {local
          ? local.phase === 'IN_SECTION' || local.phase === 'IN_REVIEW'
            ? t('exam.inProgressDetail', {
                section: t('sectioned.section', { order: local.sectionOrder }),
                answered: local.sectionAnswered,
                total: local.sectionTotal,
                time: formatClockMs(local.remainingMs) ?? '',
              })
            : t('exam.inProgressAnswered', {
                answered: local.answeredCount,
                total: local.totalQuestions,
              })
          : t('exam.inProgressElsewhere')}
      </Text>
    </Card>
  );
}

function Mix({ title, items }: { title: string; items: { key: string; label: string }[] }) {
  return (
    <View className="gap-2">
      <Text type="body-sm" weight="medium" color="muted">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {items.map((item) => (
          <Chip key={item.key} size="sm" variant="soft">
            <Chip.Label>{item.label}</Chip.Label>
          </Chip>
        ))}
      </View>
    </View>
  );
}

type SectionRowProps = {
  order: number;
  tone: Tone;
  title: string;
  instructions: string | null;
  questionsLabel: string;
};

function SectionRow({ order, tone, title, instructions, questionsLabel }: SectionRowProps) {
  return (
    <View className="px-4">
      <Card className="flex-row items-center gap-3 border border-border">
        <View>
          <IconTile tone={tone} icon="layers-outline" />
          <View className="absolute -right-1 -bottom-1 size-5 items-center justify-center rounded-full bg-surface">
            <Text type="body-xs" weight="semibold">
              {order}
            </Text>
          </View>
        </View>
        <View className="flex-1 gap-0.5">
          <Text weight="semibold">{title}</Text>
          {instructions ? (
            <Text type="body-sm" color="muted" numberOfLines={2}>
              {instructions}
            </Text>
          ) : null}
        </View>
        <View className="rounded-full bg-surface-secondary px-2 py-1">
          <Text type="body-xs" weight="medium">
            {questionsLabel}
          </Text>
        </View>
      </Card>
    </View>
  );
}

function Gap() {
  return <View className="h-3" />;
}
