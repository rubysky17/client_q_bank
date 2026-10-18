import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { Button, ErrorView, LoadingView, Text, useThemeColor } from '@/components/ui';
import { optionLetter } from '@/utils/format-duration';

/** Load the next page this many questions before the end of what is loaded. */
const PREFETCH_AHEAD = 5;

type PracticeScreenProps = {
  filters: BankFilters;
  start: number;
};

/**
 * Self-study over the question bank: answer, check right away, read the explanation. Nothing is
 * sent to the server; answers live only while the screen is open.
 */
export function PracticeScreen({ filters, start }: PracticeScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data, error, isPending, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBankQuestions(filters);
  const [index, setIndex] = useState(start);
  const [answers, setAnswers] = useState<Record<string, Answer | null>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
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

  const results = data.items.flatMap((q) => {
    if (!checked[q.id]) return [];
    const model = fromDefinition(q.type, q.definition);
    return model ? [isAnswerCorrect(model.key, answers[q.id] ?? null)] : [];
  });
  const correctCount = results.filter(Boolean).length;
  const isLast = index >= data.total - 1;

  const go = (next: number) => {
    setIndex(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <View className="flex-1">
      <Stack.Screen
        options={{
          title: t('practice.progress', { current: index + 1, total: data.total }),
          headerRight: () => (
            <Text type="body-sm" weight="semibold" className="text-success">
              {t('practice.score', { correct: correctCount, answered: results.length })}
            </Text>
          ),
        }}
      />
      <ScrollView ref={scrollRef} contentContainerClassName="gap-4 p-4">
        <PracticeQuestion
          key={question.id}
          question={question}
          answer={answers[question.id] ?? null}
          isChecked={checked[question.id] === true}
          onAnswer={(answer, checkNow) => {
            setAnswers({ ...answers, [question.id]: answer });
            if (checkNow) setChecked({ ...checked, [question.id]: true });
          }}
          onCheck={() => setChecked({ ...checked, [question.id]: true })}
        />
      </ScrollView>
      <View
        className="gap-2 border-t border-separator bg-background px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {isLast && checked[question.id] ? (
          <Text type="body-sm" color="muted" className="text-center">
            {t('practice.finished')}
          </Text>
        ) : null}
        <View className="flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            isDisabled={index === 0}
            onPress={() => go(index - 1)}
          >
            <Button.Label>{t('practice.prev')}</Button.Label>
          </Button>
          <Button
            className="flex-1"
            isDisabled={isLast || index + 1 >= loaded}
            onPress={() => go(index + 1)}
          >
            <Button.Label>{t('practice.next')}</Button.Label>
          </Button>
        </View>
      </View>
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
    <View className="gap-4">
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
      />
      <AnswerView
        input={input}
        answer={answer}
        onChange={(next) => onAnswer(next, input.type === 'SINGLE_CHOICE')}
        solution={isChecked ? key : null}
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
          <Text weight="semibold" className={isRight ? 'text-success' : 'text-danger'}>
            {isRight
              ? t('practice.correct')
              : input.type === 'DRAG_DROP'
                ? t('practice.wrongMatch')
                : t('practice.wrong', { letter: correctLabel(model) })}
          </Text>
        </View>
      ) : input.type === 'SINGLE_CHOICE' ? null : (
        <Button isDisabled={!isAnswerComplete(input, answer)} onPress={onCheck}>
          <Button.Label>{t('practice.check')}</Button.Label>
        </Button>
      )}

      {isChecked ? <Explanation explanation={question.explanation} media={question.media} /> : null}
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
