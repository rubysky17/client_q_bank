import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

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
import {
  ActionBar,
  Card,
  GradientButton,
  GradientView,
  IconButton,
  PressableFeedback,
  Text,
  useThemeColor,
} from '@/components/ui';
import { dismissVocabOnScroll, NoteSelectionBar } from '@/components/vocab';
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
  const [muted, warningSoftForeground] = useThemeColor(['muted', 'warning-soft-foreground']);
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

  const flagged = trace?.flagged ?? false;
  const toggleFlag = () =>
    dispatchAttempt(attemptId, {
      type: 'FLAG_SET',
      attemptQuestionId: current.id,
      payload: { flagged: !flagged },
    });

  return (
    <View className="flex-1">
      <View className="gap-2 px-4 pt-1">
        <View className="flex-row items-baseline justify-between">
          <View className="flex-row items-baseline gap-1">
            <Text type="h5">{t('sectioned.questionNumber', { current: index + 1 })}</Text>
            <Text type="body-sm" color="muted">{`/ ${questions.length}`}</Text>
          </View>
          <Text type="body-sm" color="muted">
            {t('attempt.answered', { answered: answeredCount, total: questions.length })}
          </Text>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
          <GradientView
            direction="horizontal"
            className="h-full rounded-full"
            style={{
              width: `${Math.round((answeredCount / Math.max(questions.length, 1)) * 100)}%`,
            }}
          />
        </View>
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
      />

      <NoteSelectionBar>
        <ActionBar>
          <IconButton
            icon="chevron-back"
            size={48}
            isDisabled={index === 0}
            onPress={() => go(index - 1)}
            accessibilityLabel={t('attempt.prev')}
          />
          <PressableFeedback
            onPress={toggleFlag}
            accessibilityRole="button"
            accessibilityState={{ checked: flagged }}
            accessibilityLabel={flagged ? t('attempt.flagged') : t('attempt.flag')}
            className={`h-12 flex-row items-center gap-1.5 rounded-3xl px-4 ${
              flagged ? 'bg-warning-soft' : 'bg-surface-secondary'
            }`}
          >
            <Ionicons
              name={flagged ? 'flag' : 'flag-outline'}
              size={16}
              color={flagged ? warningSoftForeground : muted}
            />
            <Text
              weight="medium"
              className={flagged ? 'text-warning-soft-foreground' : 'text-default-foreground'}
            >
              {t('sectioned.flagShort')}
            </Text>
          </PressableFeedback>
          {isLast ? (
            <GradientButton
              className="flex-1"
              label={t('sectioned.reviewSection')}
              icon="list"
              onPress={() => dispatchAttempt(attemptId, { type: 'SECTION_REVIEW_OPEN' })}
            />
          ) : (
            <GradientButton
              className="flex-1"
              label={t('attempt.next')}
              icon="arrow-forward"
              iconEnd
              onPress={() => go(index + 1)}
            />
          )}
        </ActionBar>
      </NoteSelectionBar>
    </View>
  );
}

type QuestionBodyProps = {
  attemptId: string;
  question: AttemptSnapshot['questions'][number];
  response: unknown;
  eliminated: string[];
  confidence: Confidence | null;
};

function QuestionBody({
  attemptId,
  question,
  response,
  eliminated,
  confidence,
}: QuestionBodyProps) {
  const { t } = useTranslation();
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
    <ScrollView
      contentContainerClassName="gap-3 px-4 pt-1 pb-4"
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={dismissVocabOnScroll}
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
          vocabId={question.id}
        />
      </Card>
      {input ? (
        <AnswerView
          input={input}
          answer={answer}
          onChange={onAnswer}
          eliminated={eliminated}
          onEliminate={input.type === 'DRAG_DROP' ? undefined : onEliminate}
          vocabId={question.id}
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
