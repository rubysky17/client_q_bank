import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { Button, ErrorView, LoadingView, Spinner, Text, useThemeColor } from '@/components/ui';
import { formatClock } from '@/utils/format-duration';

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
  const insets = useSafeAreaInsets();
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
      <Stack.Screen
        options={{
          title: attempt.examTitle,
          headerRight: () => (secondsLeft === null ? null : <TimerBadge seconds={secondsLeft} />),
        }}
      />

      <View className="flex-row items-center justify-between px-4 pt-3">
        <Text type="body-sm" weight="medium">
          {t('attempt.questionOf', { current: index + 1, total: questions.length })}
        </Text>
        <Text type="body-sm" color="muted">
          {t('attempt.answered', {
            answered: attempt.answeredCount,
            total: attempt.totalQuestions,
          })}
        </Text>
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
        onToggleFlag={() => change({ flagged: !current.flagged })}
      />

      <View
        className="gap-2 border-t border-separator bg-background px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {actionError ? (
          <Text type="body-sm" className="text-danger">
            {describeError(actionError, t)}
          </Text>
        ) : null}
        <View className="flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            isDisabled={index === 0}
            onPress={() => setIndex(index - 1)}
          >
            <Button.Label>{t('attempt.prev')}</Button.Label>
          </Button>
          {isLast ? (
            <Button className="flex-1" isDisabled={isSubmitting} onPress={confirmSubmit}>
              {isSubmitting ? <Spinner size="sm" /> : null}
              <Button.Label>{t('attempt.submit')}</Button.Label>
            </Button>
          ) : (
            <Button className="flex-1" onPress={() => setIndex(index + 1)}>
              <Button.Label>{t('attempt.next')}</Button.Label>
            </Button>
          )}
        </View>
      </View>
    </View>
  );
}

type QuestionBodyProps = {
  question: AttemptQuestion;
  onAnswer: (answer: Answer | null) => void;
  onToggleFlag: () => void;
};

function QuestionBody({ question, onAnswer, onToggleFlag }: QuestionBodyProps) {
  const { t } = useTranslation();
  const [warning, muted] = useThemeColor(['warning', 'muted']);
  const label = useQuestionLabel();
  const input = parseInput(question.type, question.data);
  const answer = parseAnswer(question.type, question.response);

  return (
    <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
      <View className="flex-row items-center justify-between gap-2">
        <QuestionTags label={label(question.sectionTitle, question.sourceNumber, question.order)} />
        <Text type="body-xs" color="muted">
          {t('attempt.points', { count: question.points })}
        </Text>
      </View>
      <QuestionStem
        caseStudy={question.caseStudy}
        content={question.content}
        media={question.media}
      />
      {input ? (
        <AnswerView input={input} answer={answer} onChange={onAnswer} />
      ) : (
        <Text type="body-sm" className="text-warning">
          {t('attempt.unsupported')}
        </Text>
      )}
      <Button variant="ghost" className="self-start" onPress={onToggleFlag}>
        <Ionicons
          name={question.flagged ? 'flag' : 'flag-outline'}
          size={18}
          color={question.flagged ? warning : muted}
        />
        <Button.Label>{question.flagged ? t('attempt.flagged') : t('attempt.flag')}</Button.Label>
      </Button>
    </ScrollView>
  );
}

export function TimerBadge({ seconds }: { seconds: number }) {
  const [warning, foreground] = useThemeColor(['warning', 'foreground']);
  const isLow = seconds <= 60;

  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name="time-outline" size={18} color={isLow ? warning : foreground} />
      <Text weight="semibold" className={isLow ? 'text-warning' : 'text-foreground'}>
        {formatClock(seconds)}
      </Text>
    </View>
  );
}
