import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';

import { clockOffsetMs } from '@/api/attempt-state';
import { type AttemptQuestion, useAttempt, useSaveAnswer, useSubmitAttempt } from '@/api/attempts';
import { describeError, toApiError } from '@/api/errors';
import {
  type Answer,
  AnswerView,
  parseAnswer,
  parseInput,
  QuestionStem,
  QuestionTags,
  useQuestionLabel,
} from '@/components/question';
import {
  ActionBar,
  Card,
  ErrorView,
  GradientButton,
  GradientView,
  IconButton,
  LoadingView,
  PressableFeedback,
  Text,
  useThemeColor,
} from '@/components/ui';
import { formatClock } from '@/utils/format-duration';

import { AttemptTopBar } from './attempt-top-bar';
import { QuestionStrip } from './question-strip';
import { useCountdown } from './use-countdown';
import { useDwellTime } from './use-dwell-time';

/** Server codes meaning the attempt can no longer take answers: show the result instead. */
const CLOSED_CODES = new Set(['ATTEMPT_EXPIRED', 'ATTEMPT_CLOSED']);

type LegacyAttemptScreenProps = {
  id: string;
};

/** One server deadline for the whole attempt; every answer is saved online right away. */
export function LegacyAttemptScreen({ id }: LegacyAttemptScreenProps) {
  const { t } = useTranslation();
  const { replace } = useRouter();
  const [muted, warningSoftForeground] = useThemeColor(['muted', 'warning-soft-foreground']);
  const { data: attempt, error, isPending, refetch, dataUpdatedAt } = useAttempt(id);
  const { mutate: saveAnswer, error: saveError } = useSaveAnswer(id);
  const { mutate: submit, isPending: isSubmitting, error: submitError } = useSubmitAttempt(id);
  const [index, setIndex] = useState(0);
  const autoSubmitted = useRef(false);

  const shownQuestionId =
    attempt?.questions[Math.min(index, attempt.questions.length - 1)]?.id ?? null;
  const takeDwell = useDwellTime(shownQuestionId);

  const offset = attempt ? clockOffsetMs(attempt.serverTime, dataUpdatedAt) : 0;
  const secondsLeft = useCountdown(attempt?.expiresAt ?? null, offset);
  const status = attempt?.status;

  const showResult = () => replace({ pathname: '/attempts/[id]/result', params: { id } });

  // Submitted or expired elsewhere (another device, or the server closed it): show the result.
  useEffect(() => {
    if (status !== undefined && status !== 'IN_PROGRESS') showResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run when the status changes only
  }, [status]);

  // Time is up: submit what was saved. The server accepts it as the attempt's final state.
  useEffect(() => {
    if (secondsLeft !== 0 || status !== 'IN_PROGRESS' || autoSubmitted.current) return;
    autoSubmitted.current = true;
    submit(undefined, { onSettled: showResult });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once when the timer hits zero
  }, [secondsLeft]);

  if (isPending) return <LoadingView />;
  if (!attempt) return <ErrorView error={error} onRetry={refetch} />;

  const questions = attempt.questions;
  const current = questions[Math.min(index, questions.length - 1)];
  if (!current) return <ErrorView error={error} onRetry={refetch} />;
  const isLast = index >= questions.length - 1;

  const change = (patch: { response?: unknown; flagged?: boolean; timeSpentMs?: number }) =>
    saveAnswer(
      { attemptQuestionId: current.id, ...patch },
      {
        onError: (err) => {
          if (CLOSED_CODES.has(toApiError(err).serverCode ?? '')) void refetch();
        },
      },
    );

  const confirmSubmit = () => {
    const unanswered = attempt.totalQuestions - attempt.answeredCount;
    Alert.alert(
      t('attempt.confirmTitle'),
      unanswered > 0
        ? t('attempt.confirmUnanswered', { count: unanswered })
        : t('attempt.confirmAll'),
      [
        { text: t('attempt.keepGoing'), style: 'cancel' },
        { text: t('attempt.submit'), onPress: () => submit(undefined, { onSuccess: showResult }) },
      ],
    );
  };

  const actionError = submitError ?? saveError;

  return (
    <View className="flex-1">
      {/* The v2 top bar replaces the native header. */}
      <Stack.Screen options={{ headerShown: false }} />
      <AttemptTopBar
        title={attempt.examTitle}
        accessory={secondsLeft === null ? null : <TimerBadge seconds={secondsLeft} />}
      />

      <View className="gap-2 px-4 pt-1">
        <View className="flex-row items-baseline justify-between">
          <View className="flex-row items-baseline gap-1">
            <Text type="h5">{t('sectioned.questionNumber', { current: index + 1 })}</Text>
            <Text type="body-sm" color="muted">{`/ ${questions.length}`}</Text>
          </View>
          <Text type="body-sm" color="muted">
            {t('attempt.answered', {
              answered: attempt.answeredCount,
              total: attempt.totalQuestions,
            })}
          </Text>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
          <GradientView
            direction="horizontal"
            className="h-full rounded-full"
            style={{
              width: `${Math.round((attempt.answeredCount / Math.max(attempt.totalQuestions, 1)) * 100)}%`,
            }}
          />
        </View>
      </View>
      <View className="h-14">
        <QuestionStrip
          items={questions.map((question) => ({
            id: question.id,
            isAnswered: question.response != null,
            isFlagged: question.flagged,
          }))}
          currentIndex={index}
          onSelect={setIndex}
        />
      </View>

      <QuestionBody
        key={current.id}
        question={current}
        onAnswer={(answer) => change({ response: answer, timeSpentMs: takeDwell() })}
      />

      {actionError ? (
        <Text type="body-sm" className="px-4 pb-2 text-danger">
          {describeError(actionError, t)}
        </Text>
      ) : null}
      <ActionBar>
        <IconButton
          icon="chevron-back"
          size={48}
          isDisabled={index === 0}
          onPress={() => setIndex(index - 1)}
          accessibilityLabel={t('attempt.prev')}
        />
        <PressableFeedback
          onPress={() => change({ flagged: !current.flagged })}
          accessibilityRole="button"
          accessibilityState={{ checked: current.flagged }}
          accessibilityLabel={current.flagged ? t('attempt.flagged') : t('attempt.flag')}
          className={`h-12 flex-row items-center gap-1.5 rounded-3xl px-4 ${
            current.flagged ? 'bg-warning-soft' : 'bg-surface-secondary'
          }`}
        >
          <Ionicons
            name={current.flagged ? 'flag' : 'flag-outline'}
            size={16}
            color={current.flagged ? warningSoftForeground : muted}
          />
          <Text
            weight="medium"
            className={current.flagged ? 'text-warning-soft-foreground' : 'text-default-foreground'}
          >
            {t('sectioned.flagShort')}
          </Text>
        </PressableFeedback>
        {isLast ? (
          <GradientButton
            className="flex-1"
            icon="paper-plane-outline"
            label={t('attempt.submit')}
            isLoading={isSubmitting}
            onPress={confirmSubmit}
          />
        ) : (
          <GradientButton
            className="flex-1"
            icon="arrow-forward"
            iconEnd
            label={t('attempt.next')}
            onPress={() => setIndex(index + 1)}
          />
        )}
      </ActionBar>
    </View>
  );
}

type QuestionBodyProps = {
  question: AttemptQuestion;
  onAnswer: (answer: Answer | null) => void;
};

function QuestionBody({ question, onAnswer }: QuestionBodyProps) {
  const { t } = useTranslation();
  const label = useQuestionLabel();
  const input = parseInput(question.type, question.data);
  const answer = parseAnswer(question.type, question.response);

  return (
    <ScrollView
      contentContainerClassName="gap-3 px-4 pt-1 pb-4"
      keyboardShouldPersistTaps="handled"
    >
      <Card className="gap-3 border border-border">
        <View className="flex-row items-center justify-between gap-2">
          <QuestionTags
            label={label(question.sectionTitle, question.sourceNumber, question.order)}
          />
          <Text type="body-xs" weight="medium" color="muted">
            {t('attempt.points', { count: question.points })}
          </Text>
        </View>
        <QuestionStem
          caseStudy={question.caseStudy}
          content={question.content}
          media={question.media}
        />
      </Card>
      {input ? (
        <AnswerView input={input} answer={answer} onChange={onAnswer} />
      ) : (
        <Text type="body-sm" className="text-warning">
          {t('attempt.unsupported')}
        </Text>
      )}
    </ScrollView>
  );
}

export function TimerBadge({ seconds }: { seconds: number }) {
  const [warningSoftForeground, foreground] = useThemeColor([
    'warning-soft-foreground',
    'foreground',
  ]);
  const isLow = seconds <= 60;

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${
        isLow ? 'bg-warning-soft' : 'bg-surface-secondary'
      }`}
    >
      <Ionicons name="timer-outline" size={16} color={isLow ? warningSoftForeground : foreground} />
      <Text
        type="body-sm"
        weight="semibold"
        className={isLow ? 'text-warning-soft-foreground' : 'text-foreground'}
        style={{ fontVariant: ['tabular-nums'] }}
      >
        {formatClock(seconds)}
      </Text>
    </View>
  );
}
