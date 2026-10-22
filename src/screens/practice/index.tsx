import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, View } from 'react-native';

import { type BankFilters, type BankQuestion, useBankQuestions } from '@/api/question-bank';
import {
  type Answer,
  AnswerView,
  Explanation,
  fromDefinition,
  isAnswerComplete,
  isAnswerCorrect,
  QuestionStem,
  QuestionTags,
} from '@/components/question';
import {
  ActionBar,
  Card,
  ErrorView,
  GradientButton,
  GradientView,
  IconButton,
  LoadingView,
  Text,
  useThemeColor,
} from '@/components/ui';
import {
  dismissVocabOnScroll,
  NoteModeHint,
  NoteSelectionBar,
  NoteToggle,
  VocabScope,
} from '@/components/vocab';
import { AttemptTopBar } from '@/screens/attempt/attempt-top-bar';
import {
  checkPracticeAnswer,
  resetPractice,
  savePracticeAnswer,
  useUserStateStore,
} from '@/stores/user-state-store';
import { optionLetter } from '@/utils/format-duration';
import { practiceOf } from '@/user-state/practice';

/** Load the next page this many questions before the end of what is loaded. */
const PREFETCH_AHEAD = 5;

type PracticeScreenProps = {
  filters: BankFilters;
  start: number;
};

/**
 * Self-study over the question bank: answer, check right away, read the explanation. Answers are
 * kept on the device and synced to the user's other devices (`stores/user-state-store.ts`).
 */
export function PracticeScreen({ filters, start }: PracticeScreenProps) {
  const { t } = useTranslation();
  const success = useThemeColor('success');
  const { data, error, isPending, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBankQuestions(filters);
  const [index, setIndex] = useState(start);
  const items = useUserStateStore((s) => s.items);
  const scrollRef = useRef<ScrollView>(null);

  const loaded = data?.items.length ?? 0;
  // The list screen may have shown only the first pages: keep loading ahead of the reader.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && index >= loaded - PREFETCH_AHEAD) {
      void fetchNextPage();
    }
  }, [index, loaded, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) return <LoadingView />;
  if (!data) return <ErrorView error={error} onRetry={refetch} />;

  const question = data.items[Math.min(index, loaded - 1)];
  if (!question) return <ErrorView error={error} onRetry={refetch} />;

  const practiced = data.items.flatMap((q) => {
    const done = practiceOf<Answer>(items, q.id);
    return done ? [{ question: q, ...done }] : [];
  });
  const results = practiced.flatMap(({ question: q, response, checked }) => {
    if (!checked) return [];
    const model = fromDefinition(q.type, q.definition);
    return model ? [isAnswerCorrect(model.key, response)] : [];
  });
  const current = practiceOf<Answer>(items, question.id);
  const correctCount = results.filter(Boolean).length;
  const isLast = index >= data.total - 1;

  const go = (next: number) => {
    setIndex(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const confirmReset = () =>
    Alert.alert(
      t('practice.resetTitle'),
      t('practice.resetMessage', { count: practiced.length }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('practice.reset'),
          style: 'destructive',
          onPress: () => resetPractice(practiced.map(({ question: q }) => q.id)),
        },
      ],
    );

  return (
    <View className="flex-1">
      {/* The v2 top bar replaces the native header. */}
      <Stack.Screen options={{ headerShown: false }} />
      <AttemptTopBar
        title={t('practice.progress', { current: index + 1, total: data.total })}
        subtitle={t('practice.title')}
        accessory={
          <View className="flex-row items-center gap-2">
            {practiced.length > 0 ? (
              <IconButton
                icon="refresh"
                size={36}
                onPress={confirmReset}
                accessibilityLabel={t('practice.reset')}
              />
            ) : null}
            <NoteToggle />
            <View className="flex-row items-center gap-1 rounded-full bg-success-soft px-3 py-2">
              <Ionicons name="checkmark-circle" size={14} color={success} />
              <Text type="body-sm" weight="semibold" className="text-success-soft-foreground">
                {t('practice.score', { correct: correctCount, answered: results.length })}
              </Text>
            </View>
          </View>
        }
      />
      <NoteModeHint />
      <VocabScope
        sourceTitle={question.examTitle || t('vocab.practiceSource')}
        resetKey={question.id}
      />
      <View className="mx-4 mb-1 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
        <GradientView
          direction="horizontal"
          className="h-full rounded-full"
          style={{ width: `${Math.round(((index + 1) / Math.max(data.total, 1)) * 100)}%` }}
        />
      </View>
      <ScrollView
        ref={scrollRef}
        contentContainerClassName="gap-3 px-4 pt-2 pb-4"
        onScrollBeginDrag={dismissVocabOnScroll}
      >
        <PracticeQuestion
          key={question.id}
          question={question}
          answer={current?.response ?? null}
          isChecked={current?.checked === true}
          onAnswer={(answer, checkNow) => savePracticeAnswer(question.id, answer, checkNow)}
          onCheck={() => checkPracticeAnswer(question.id)}
        />
      </ScrollView>
      {isLast && current?.checked ? (
        <Text type="body-sm" color="muted" className="px-4 pb-2 text-center">
          {t('practice.finished')}
        </Text>
      ) : null}
      <NoteSelectionBar>
        <ActionBar>
          <IconButton
            icon="chevron-back"
            size={48}
            isDisabled={index === 0}
            onPress={() => go(index - 1)}
            accessibilityLabel={t('practice.prev')}
          />
          <GradientButton
            className="flex-1"
            icon="arrow-forward"
            iconEnd
            label={t('practice.next')}
            isDisabled={isLast || index + 1 >= loaded}
            onPress={() => go(index + 1)}
          />
        </ActionBar>
      </NoteSelectionBar>
    </View>
  );
}

type PracticeQuestionProps = {
  question: BankQuestion;
  answer: Answer | null;
  isChecked: boolean;
  /** `checkNow`: single choice is checked on the first tap. */
  onAnswer: (answer: Answer | null, checkNow: boolean) => void;
  onCheck: () => void;
};

function PracticeQuestion({
  question,
  answer,
  isChecked,
  onAnswer,
  onCheck,
}: PracticeQuestionProps) {
  const { t } = useTranslation();
  const [success, danger] = useThemeColor(['success', 'danger']);
  const model = fromDefinition(question.type, question.definition);

  if (!model) {
    return (
      <Text type="body-sm" className="text-warning">
        {t('attempt.unsupported')}
      </Text>
    );
  }
  const { input, key } = model;
  const isRight = isChecked && isAnswerCorrect(key, answer);

  return (
    <View className="gap-3">
      <Card className="gap-3 border border-border">
        <QuestionTags
          label={`${question.examTitle} · ${question.sectionTitle} · ${t('question.number', {
            n: question.sourceNumber ?? question.order,
          })}`}
          domain={question.domain?.name}
          difficulty={question.difficulty}
        />
        <QuestionStem
          caseStudy={question.caseStudy}
          content={question.content}
          media={question.media}
          vocabId={question.id}
        />
      </Card>
      <AnswerView
        input={input}
        answer={answer}
        onChange={(next) => onAnswer(next, input.type === 'SINGLE_CHOICE')}
        solution={isChecked ? key : null}
        vocabId={question.id}
      />

      {isChecked ? (
        <View
          className={`flex-row items-center gap-2 rounded-2xl p-4 ${
            isRight ? 'bg-success-soft' : 'bg-danger-soft'
          }`}
        >
          <Ionicons
            name={isRight ? 'checkmark-circle' : 'close-circle'}
            size={22}
            color={isRight ? success : danger}
          />
          <Text
            weight="semibold"
            className={`flex-1 ${isRight ? 'text-success-soft-foreground' : 'text-danger-soft-foreground'}`}
          >
            {isRight
              ? t('practice.correct')
              : input.type === 'DRAG_DROP'
                ? t('practice.wrongMatch')
                : t('practice.wrong', { letter: correctLabel(model) })}
          </Text>
        </View>
      ) : input.type === 'SINGLE_CHOICE' ? null : (
        <GradientButton
          icon="checkmark-done"
          label={t('practice.check')}
          isDisabled={!isAnswerComplete(input, answer)}
          onPress={onCheck}
        />
      )}

      {isChecked ? (
        <Explanation
          explanation={question.explanation}
          media={question.media}
          vocabId={question.id}
        />
      ) : null}
    </View>
  );
}

/** "C" or "A, D" for choice questions. */
function correctLabel({ input, key }: NonNullable<ReturnType<typeof fromDefinition>>): string {
  if (input.type === 'DRAG_DROP' || key.type === 'DRAG_DROP') return '';
  const ids = key.type === 'SINGLE_CHOICE' ? [key.correctOptionId] : key.correctOptionIds;
  return input.options
    .flatMap((option, i) => (ids.includes(option.id) ? [optionLetter(i)] : []))
    .join(', ');
}
