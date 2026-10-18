import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isAnswered } from '@/attempt-engine/metrics';
import { activeSection } from '@/attempt-engine/reducer';
import type { Confidence, SessionState } from '@/attempt-engine/types';
import {
  type Answer,
  AnswerView,
  parseAnswer,
  parseInput,
  QuestionStem,
  QuestionTags,
  useQuestionLabel,
} from '@/components/question';
import { Button, PressableFeedback, Text, useThemeColor } from '@/components/ui';
import { type AttemptSnapshot, dispatchAttempt } from '@/stores/attempt-sessions';

import { QuestionStrip } from '../question-strip';
import { ConfidencePicker } from './confidence-picker';

type QuestionScreenProps = {
  state: SessionState;
  snapshot: AttemptSnapshot;
};

/** The running section, one question at a time. Only this section's questions can be reached. */
export function QuestionScreen({ state, snapshot }: QuestionScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const section = activeSection(state);
  const questions = snapshot.questions.filter((q) => q.sectionOrder === section?.order);
  const index = Math.max(
    0,
    questions.findIndex((q) => q.id === state.currentQuestionId),
  );
  const current = questions[index];
  const attemptId = state.attemptId;
  const currentId = state.currentQuestionId;

  // Entering the section (or coming back from the review): put a question on screen.
  useEffect(() => {
    if (currentId === null && current) {
      dispatchAttempt(attemptId, { type: 'QUESTION_VIEW', attemptQuestionId: current.id });
    }
  }, [attemptId, currentId, current]);

  if (!section || !current) return null;
  const trace = state.questions[current.id];
  const isLast = index >= questions.length - 1;
  const answeredCount = questions.filter((q) => isAnswered(state.questions[q.id])).length;

  const go = (to: number) => {
    const target = questions[to];
    if (target) dispatchAttempt(attemptId, { type: 'QUESTION_VIEW', attemptQuestionId: target.id });
  };

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-4 pt-3">
        <Text type="body-sm" weight="medium">
          {t('attempt.questionOf', { current: index + 1, total: questions.length })}
        </Text>
        <Text type="body-sm" color="muted">
          {t('attempt.answered', { answered: answeredCount, total: questions.length })}
        </Text>
      </View>
      <View className="h-14">
        <QuestionStrip
          items={questions.map((q) => ({
            id: q.id,
            isAnswered: isAnswered(state.questions[q.id]),
            isFlagged: state.questions[q.id]?.flagged ?? false,
          }))}
          currentIndex={index}
          onSelect={go}
        />
      </View>

      <QuestionBody
        key={current.id}
        attemptId={attemptId}
        question={current}
        response={trace?.response ?? null}
        eliminated={trace?.eliminated ?? []}
        confidence={trace?.confidence ?? null}
        flagged={trace?.flagged ?? false}
      />

      <View
        className="flex-row gap-3 border-t border-separator bg-background px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <Button
          variant="secondary"
          className="flex-1"
          isDisabled={index === 0}
          onPress={() => go(index - 1)}
        >
          <Button.Label>{t('attempt.prev')}</Button.Label>
        </Button>
        {isLast ? (
          <Button
            className="flex-1"
            onPress={() => dispatchAttempt(attemptId, { type: 'SECTION_REVIEW_OPEN' })}
          >
            <Button.Label>{t('sectioned.reviewSection')}</Button.Label>
          </Button>
        ) : (
          <Button className="flex-1" onPress={() => go(index + 1)}>
            <Button.Label>{t('attempt.next')}</Button.Label>
          </Button>
        )}
      </View>
    </View>
  );
}

type QuestionBodyProps = {
  attemptId: string;
  question: AttemptSnapshot['questions'][number];
  response: unknown;
  eliminated: string[];
  confidence: Confidence | null;
  flagged: boolean;
};

function QuestionBody({
  attemptId,
  question,
  response,
  eliminated,
  confidence,
  flagged,
}: QuestionBodyProps) {
  const { t } = useTranslation();
  const [warning, muted] = useThemeColor(['warning', 'muted']);
  const label = useQuestionLabel();
  const input = parseInput(question.type, question.data);
  const answer = parseAnswer(question.type, response);
  const record = (type: Parameters<typeof dispatchAttempt>[1]['type'], payload?: object) =>
    dispatchAttempt(attemptId, {
      type,
      attemptQuestionId: question.id,
      payload: payload as Record<string, unknown> | undefined,
    });

  const picked = (a: Answer | null) =>
    a === null ? [] : 'optionId' in a ? [a.optionId] : 'optionIds' in a ? a.optionIds : [];

  const onAnswer = (next: Answer | null) => {
    if (next === null) {
      record('ANSWER_CLEAR');
      return;
    }
    // Picking a crossed-out option brings it back first.
    for (const optionId of picked(next)) {
      if (eliminated.includes(optionId)) record('OPTION_RESTORE', { optionId });
    }
    record('ANSWER_SELECT', { response: next });
  };

  const onEliminate = (optionId: string, eliminate: boolean) => {
    if (eliminate && picked(answer).includes(optionId)) {
      // Crossing out the picked option takes it out of the answer.
      const rest = picked(answer).filter((id) => id !== optionId);
      if (answer && 'optionIds' in answer && rest.length > 0) {
        record('ANSWER_SELECT', { response: { optionIds: rest } });
      } else {
        record('ANSWER_CLEAR');
      }
    }
    record(eliminate ? 'OPTION_ELIMINATE' : 'OPTION_RESTORE', { optionId });
  };

  return (
    <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
      <View className="flex-row items-center justify-between gap-2">
        <QuestionTags label={label(question.sectionTitle, question.sourceNumber, question.order)} />
        <PressableFeedback
          onPress={() => record('FLAG_SET', { flagged: !flagged })}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityState={{ checked: flagged }}
          accessibilityLabel={flagged ? t('attempt.flagged') : t('attempt.flag')}
          className="flex-row items-center gap-1"
        >
          <Ionicons
            name={flagged ? 'flag' : 'flag-outline'}
            size={20}
            color={flagged ? warning : muted}
          />
          <Text type="body-sm" className={flagged ? 'text-warning' : 'text-muted'}>
            {flagged ? t('attempt.flagged') : t('sectioned.flagShort')}
          </Text>
        </PressableFeedback>
      </View>
      <QuestionStem
        caseStudy={question.caseStudy}
        content={question.content}
        media={question.media}
      />
      {input ? (
        <AnswerView
          input={input}
          answer={answer}
          onChange={onAnswer}
          eliminated={eliminated}
          onEliminate={input.type === 'DRAG_DROP' ? undefined : onEliminate}
        />
      ) : (
        <Text type="body-sm" className="text-warning">
          {t('attempt.unsupported')}
        </Text>
      )}
      {answer ? (
        <ConfidencePicker
          value={confidence}
          onChange={(level) => record('CONFIDENCE_SET', { level })}
        />
      ) : null}
    </ScrollView>
  );
}
