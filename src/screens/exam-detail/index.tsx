import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { syncAttempt } from '@/api/attempt-sync';
import { type CatalogExamDetail, useCatalogExam, useStartAttempt } from '@/api/catalog';
import { describeError } from '@/api/errors';
import type { LocalAttemptSummary } from '@/attempt-engine/local-store';
import { Button, Card, Chip, ErrorView, LoadingView, Spinner, Text } from '@/components/ui';
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
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const { data: exam, error, isPending, refetch } = useCatalogExam(id);
  const { mutate: start, isPending: isStarting, error: startError } = useStartAttempt(id);
  // The device copy comes first: it is up to date even offline.
  const local = useLocalAttemptForExam(id);
  const localAttempts = useLocalAttempts();
  const [isResetting, setIsResetting] = useState(false);

  if (isPending) return <LoadingView />;
  if (!exam) return <ErrorView error={error} onRetry={refetch} />;

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
            title={item.title}
            instructions={item.instructions}
            questionsLabel={t('exam.sectionQuestions', { count: item.questionCount })}
          />
        )}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={<ExamSummary exam={exam} />}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16 }}
      />
      <View
        className="gap-2 border-t border-separator bg-background px-4 pt-3"
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
              <Button className="flex-1" onPress={onStart} isDisabled={isResetting}>
                <Button.Label>{t('exam.continue')}</Button.Label>
              </Button>
            </View>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              onPress={() => push({ pathname: '/practice', params: toParams({ examId: exam.id }) })}
            >
              <Button.Label>{t('exam.practice')}</Button.Label>
            </Button>
            <Button onPress={onStart} isDisabled={isStarting}>
              {isStarting ? <Spinner size="sm" /> : null}
              <Button.Label>{t('exam.start')}</Button.Label>
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

function ExamSummary({ exam }: { exam: CatalogExamDetail }) {
  const { t } = useTranslation();

  return (
    <View className="gap-4 pb-4">
      <View className="flex-row">
        <Chip size="sm" variant="soft" color="accent">
          <Chip.Label>{exam.topic.name}</Chip.Label>
        </Chip>
      </View>
      <View className="gap-1">
        <Text type="h3">{exam.title}</Text>
        <Text type="body-sm" color="muted">
          {t('exam.by', { name: exam.owner.fullName })}
        </Text>
      </View>
      {exam.description ? <Text className="leading-6">{exam.description}</Text> : null}

      <Card className="flex-row flex-wrap gap-y-3">
        <Fact label={t('exam.questions')} value={String(exam.questionCount)} />
        <Fact label={t('exam.duration')} value={durationLabel(exam, t)} />
        <Fact
          label={t('exam.passMark')}
          value={exam.passingScore === null ? t('exam.noPassMark') : `${exam.passingScore}%`}
        />
        <Fact label={t('exam.totalPoints')} value={String(exam.totalPoints)} />
      </Card>

      {exam.breakdown.domains.length > 0 ? (
        <Mix
          title={t('exam.byDomain')}
          items={exam.breakdown.domains.map((d) => ({
            key: d.domainId ?? 'none',
            label: `${d.name} · ${d.questionCount}`,
          }))}
        />
      ) : null}
      {exam.breakdown.difficulties.length > 0 ? (
        <Mix
          title={t('exam.byDifficulty')}
          items={exam.breakdown.difficulties.map((d) => ({
            key: d.difficulty,
            label: `${t(`difficulty.${d.difficulty}`)} · ${d.questionCount}`,
          }))}
        />
      ) : null}

      {exam.myAttemptCount > 0 ? (
        <Text type="body-sm" color="muted">
          {t('exam.myAttempts', { count: exam.myAttemptCount })}
        </Text>
      ) : null}

      <Text type="body-sm" weight="medium" color="muted">
        {t('exam.structure')}
      </Text>
    </View>
  );
}

/** "3 sections × 60 min, 10-min break" for sectioned exams, else the total time. */
function durationLabel(exam: CatalogExamDetail, t: ReturnType<typeof useTranslation>['t']) {
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
    <Card className="gap-1 bg-accent-soft">
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

type SectionRowProps = {
  order: number;
  title: string;
  instructions: string | null;
  questionsLabel: string;
};

function SectionRow({ order, title, instructions, questionsLabel }: SectionRowProps) {
  return (
    <Card className="flex-row items-center gap-3">
      <View className="size-9 items-center justify-center rounded-full bg-accent-soft">
        <Text weight="semibold" className="text-accent-soft-foreground">
          {order}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text weight="semibold">{title}</Text>
        {instructions ? (
          <Text type="body-sm" color="muted" numberOfLines={2}>
            {instructions}
          </Text>
        ) : null}
      </View>
      <Text type="body-sm" color="muted">
        {questionsLabel}
      </Text>
    </Card>
  );
}

function Gap() {
  return <View className="h-3" />;
}
