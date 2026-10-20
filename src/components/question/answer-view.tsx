import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip, PressableFeedback, Text, useThemeColor } from '@/components/ui';
import { useNoteMode, VocabText } from '@/components/vocab';
import { optionLetter } from '@/utils/format-duration';

import {
  type Answer,
  type AnswerKey,
  placeChoice,
  type QuestionInput,
  toggleOption,
} from './answer-model';

type AnswerViewProps = {
  input: QuestionInput;
  answer: Answer | null;
  /** Omit to show the answer read-only. */
  onChange?: (answer: Answer | null) => void;
  /** Shows right/wrong marks and the correct answer (review, practice after checking). */
  solution?: AnswerKey | null;
  /** Choice types: options crossed out by the user. */
  eliminated?: readonly string[];
  /** Choice types: shows an X on each option to cross it out (or bring it back). */
  onEliminate?: (optionId: string, eliminate: boolean) => void;
  /** Turns on the vocabulary layer, e.g. the question id (blocks `${vocabId}:option:…`). */
  vocabId?: string;
};

/**
 * Answer area of a question, for every supported type. In note mode (vocabulary), taps go to the
 * words: nothing can be picked, crossed out or placed.
 */
export function AnswerView({
  input,
  answer,
  onChange,
  solution = null,
  eliminated = [],
  onEliminate,
  vocabId,
}: AnswerViewProps) {
  const isLocked = onChange === undefined || solution !== null;
  const isNoting = useNoteMode() && vocabId !== undefined;

  if (input.type === 'DRAG_DROP') {
    return (
      <MatchingView
        input={input}
        answer={answer}
        onChange={isLocked ? undefined : onChange}
        solution={solution?.type === 'DRAG_DROP' ? solution : null}
        vocabId={vocabId}
        isNoting={isNoting}
      />
    );
  }
  return (
    <ChoiceView
      input={input}
      answer={answer}
      onChange={isLocked ? undefined : onChange}
      solution={solution}
      eliminated={eliminated}
      onEliminate={isLocked ? undefined : onEliminate}
      vocabId={vocabId}
      isNoting={isNoting}
    />
  );
}

type ChoiceViewProps = {
  input: Extract<QuestionInput, { type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' }>;
  answer: Answer | null;
  onChange?: (answer: Answer | null) => void;
  solution: AnswerKey | null;
  eliminated: readonly string[];
  onEliminate?: (optionId: string, eliminate: boolean) => void;
  vocabId: string | undefined;
  isNoting: boolean;
};

function ChoiceView({
  input,
  answer,
  onChange,
  solution,
  eliminated,
  onEliminate,
  vocabId,
  isNoting,
}: ChoiceViewProps) {
  const { t } = useTranslation();
  const picked = new Set(
    answer && 'optionId' in answer
      ? [answer.optionId]
      : answer && 'optionIds' in answer
        ? answer.optionIds
        : [],
  );
  const correct = new Set(
    solution?.type === 'SINGLE_CHOICE'
      ? [solution.correctOptionId]
      : solution?.type === 'MULTIPLE_CHOICE'
        ? solution.correctOptionIds
        : [],
  );
  const isMulti = input.type === 'MULTIPLE_CHOICE';

  return (
    <View className="gap-3">
      {isMulti ? (
        <Text type="body-sm" weight="semibold" className="text-accent">
          {t('question.selectCount', { count: input.selectCount })}
        </Text>
      ) : null}
      {input.options.map((option, index) => (
        <OptionRow
          key={option.id}
          letter={optionLetter(index)}
          content={option.content}
          blockId={vocabId === undefined ? undefined : `${vocabId}:option:${option.id}`}
          isNoting={isNoting}
          isMulti={isMulti}
          isPicked={picked.has(option.id)}
          isEliminated={eliminated.includes(option.id)}
          onEliminate={
            onEliminate ? () => onEliminate(option.id, !eliminated.includes(option.id)) : undefined
          }
          mark={
            solution === null
              ? null
              : correct.has(option.id)
                ? 'correct'
                : picked.has(option.id)
                  ? 'wrong'
                  : null
          }
          onPress={onChange ? () => onChange(toggleOption(input, answer, option.id)) : undefined}
        />
      ))}
    </View>
  );
}

type OptionRowProps = {
  letter: string;
  content: string;
  /** Vocabulary block of the option text (none: plain text). */
  blockId: string | undefined;
  /** Note mode: the row ignores presses so its words can be tapped. */
  isNoting: boolean;
  isMulti: boolean;
  isPicked: boolean;
  isEliminated: boolean;
  mark: 'correct' | 'wrong' | null;
  onPress?: () => void;
  onEliminate?: () => void;
};

function OptionRow({
  letter,
  content,
  blockId,
  isNoting,
  isMulti,
  isPicked,
  isEliminated,
  mark,
  onPress,
  onEliminate,
}: OptionRowProps) {
  const { t } = useTranslation();
  const [success, danger, muted] = useThemeColor(['success', 'danger', 'muted']);
  const tone =
    mark === 'correct'
      ? 'border-success bg-success-soft'
      : mark === 'wrong'
        ? 'border-danger bg-danger-soft'
        : isPicked
          ? 'border-accent bg-accent-soft'
          : 'border-border bg-surface';

  const isDisabled = onPress === undefined || isNoting;

  return (
    <PressableFeedback
      onPress={onPress}
      isDisabled={isDisabled}
      accessibilityRole={isMulti ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: isPicked, disabled: isDisabled }}
      className={`flex-row items-center gap-3 rounded-2xl border-2 p-4 ${tone} ${
        isEliminated ? 'opacity-50' : ''
      }`}
    >
      <View
        className={`size-8 items-center justify-center ${isMulti ? 'rounded-lg' : 'rounded-full'} ${
          isPicked ? 'bg-accent' : 'bg-surface-secondary'
        }`}
      >
        <Text weight="semibold" className={isPicked ? 'text-accent-foreground' : 'text-foreground'}>
          {letter}
        </Text>
      </View>
      <Text className={`flex-1 leading-6 ${isEliminated ? 'line-through' : ''}`}>
        {blockId === undefined ? content : <VocabText text={content} blockId={blockId} />}
      </Text>
      {mark === 'correct' ? <Ionicons name="checkmark-circle" size={22} color={success} /> : null}
      {mark === 'wrong' ? <Ionicons name="close-circle" size={22} color={danger} /> : null}
      {onEliminate ? (
        <PressableFeedback
          onPress={onEliminate}
          isDisabled={isNoting}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            isEliminated
              ? t('question.restoreOption', { letter })
              : t('question.eliminateOption', { letter })
          }
          className="size-8 items-center justify-center rounded-full"
        >
          <Ionicons name={isEliminated ? 'arrow-undo' : 'close'} size={20} color={muted} />
        </PressableFeedback>
      ) : null}
    </PressableFeedback>
  );
}

type MatchingViewProps = {
  input: Extract<QuestionInput, { type: 'DRAG_DROP' }>;
  answer: Answer | null;
  onChange?: (answer: Answer | null) => void;
  solution: Extract<AnswerKey, { type: 'DRAG_DROP' }> | null;
  vocabId: string | undefined;
  isNoting: boolean;
};

/**
 * Drag and drop, made for touch: tap a target, then the choice that belongs there. A choice
 * already placed elsewhere moves to the new target.
 */
function MatchingView({ input, answer, onChange, solution, vocabId, isNoting }: MatchingViewProps) {
  const { t } = useTranslation();
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const pairs = answer && 'pairs' in answer ? answer.pairs : {};
  const choiceById = new Map(input.choices.map((choice) => [choice.id, choice]));
  const used = new Set(Object.values(pairs));
  const [success, danger, muted] = useThemeColor(['success', 'danger', 'muted']);

  const place = (targetId: string, choiceId: string | null) => {
    onChange?.(placeChoice(answer, targetId, choiceId));
    setActiveTarget(null);
  };

  return (
    <View className="gap-3">
      {onChange ? (
        <Text type="body-sm" color="muted">
          {t('question.matchHint')}
        </Text>
      ) : null}
      {input.targets.map((target, index) => {
        const placed = choiceById.get(pairs[target.id] ?? '');
        const expected = solution ? choiceById.get(solution.pairs[target.id] ?? '') : undefined;
        const mark = solution ? (placed && placed.id === expected?.id ? 'correct' : 'wrong') : null;
        const isActive = activeTarget === target.id;
        const tone =
          mark === 'correct'
            ? 'border-success bg-success-soft'
            : mark === 'wrong'
              ? 'border-danger bg-danger-soft'
              : isActive
                ? 'border-accent bg-accent-soft'
                : 'border-border bg-surface';

        return (
          <View key={target.id} className={`gap-3 rounded-2xl border-2 p-4 ${tone}`}>
            <PressableFeedback
              onPress={onChange ? () => setActiveTarget(isActive ? null : target.id) : undefined}
              isDisabled={onChange === undefined || isNoting}
              accessibilityRole="button"
              accessibilityState={{ expanded: isActive }}
              className="gap-2"
            >
              <Text type="body-sm" className="leading-5">
                {`${index + 1}. `}
                {vocabId === undefined ? (
                  target.content
                ) : (
                  <VocabText text={target.content} blockId={`${vocabId}:target:${target.id}`} />
                )}
              </Text>
              <View className="flex-row items-center gap-2">
                <Ionicons name="arrow-forward" size={16} color={muted} />
                <Text
                  weight={placed ? 'semibold' : 'normal'}
                  className={placed ? 'flex-1 text-foreground' : 'flex-1 text-muted'}
                >
                  {placed ? placed.content : t('question.pickChoice')}
                </Text>
                {mark === 'correct' ? (
                  <Ionicons name="checkmark-circle" size={22} color={success} />
                ) : null}
                {mark === 'wrong' ? (
                  <Ionicons name="close-circle" size={22} color={danger} />
                ) : null}
              </View>
              {mark === 'wrong' && expected ? (
                <Text type="body-sm" weight="semibold" className="text-success">
                  {t('question.correctIs', { answer: expected.content })}
                </Text>
              ) : null}
            </PressableFeedback>

            {isActive ? (
              <View className="flex-row flex-wrap gap-2">
                {input.choices.map((choice) => (
                  <Chip
                    key={choice.id}
                    size="md"
                    variant={choice.id === placed?.id ? 'primary' : 'soft'}
                    color={used.has(choice.id) && choice.id !== placed?.id ? 'default' : 'accent'}
                    disabled={isNoting}
                    onPress={() => place(target.id, choice.id)}
                  >
                    <Chip.Label>{choice.content}</Chip.Label>
                  </Chip>
                ))}
                {placed ? (
                  <Chip
                    size="md"
                    variant="secondary"
                    disabled={isNoting}
                    onPress={() => place(target.id, null)}
                  >
                    <Chip.Label>{t('question.clear')}</Chip.Label>
                  </Chip>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
