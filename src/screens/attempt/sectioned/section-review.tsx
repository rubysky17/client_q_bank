import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList } from '@shopify/flash-list';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { isAnswered } from '@/attempt-engine/metrics';
import { activeSection } from '@/attempt-engine/reducer';
import type { SessionState } from '@/attempt-engine/types';
import {
  ActionBar,
  GradientButton,
  PressableFeedback,
  SegmentedControl,
  Text,
  useThemeColor,
} from '@/components/ui';
import { type AttemptSnapshot, dispatchAttempt } from '@/stores/attempt-sessions';

type Filter = 'ALL' | 'FLAGGED' | 'UNANSWERED';

type SectionReviewProps = {
  state: SessionState;
  snapshot: AttemptSnapshot;
  sectionTitle: (order: number) => string;
};

/**
 * End of a section: every question at a glance, flagged ones first in mind. The clock keeps running;
 * the user goes back to any question of this section, or ends it (for good).
 */
export function SectionReview({ state, snapshot, sectionTitle }: SectionReviewProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Filter>('ALL');
  const section = activeSection(state);
  if (!section) return null;

  const items = snapshot.questions
    .filter((q) => q.sectionOrder === section.order)
    .map((q, index) => ({
      id: q.id,
      number: index + 1,
      answered: isAnswered(state.questions[q.id]),
      flagged: state.questions[q.id]?.flagged ?? false,
    }));
  const flaggedCount = items.filter((i) => i.flagged).length;
  const unansweredCount = items.filter((i) => !i.answered).length;
  const shown = items.filter((i) =>
    filter === 'FLAGGED' ? i.flagged : filter === 'UNANSWERED' ? !i.answered : true,
  );
  const hasNext = state.sections.some((s) => s.status === 'LOCKED');

  const open = (questionId: string) =>
    dispatchAttempt(state.attemptId, { type: 'QUESTION_VIEW', attemptQuestionId: questionId });

  const confirmEnd = () =>
    Alert.alert(
      t('sectioned.endTitle', { title: sectionTitle(section.order) }),
      [
        unansweredCount > 0 ? t('sectioned.endUnanswered', { count: unansweredCount }) : null,
        flaggedCount > 0 ? t('sectioned.endFlagged', { count: flaggedCount }) : null,
        hasNext ? t('sectioned.endLocked') : t('sectioned.endSubmits'),
      ]
        .filter(Boolean)
        .join('\n'),
      [
        { text: t('attempt.keepGoing'), style: 'cancel' },
        {
          text: hasNext ? t('sectioned.endSection') : t('attempt.submit'),
          style: 'destructive',
          onPress: () =>
            dispatchAttempt(state.attemptId, { type: 'SECTION_END', payload: { reason: 'USER' } }),
        },
      ],
    );

  return (
    <View className="flex-1">
      <View className="gap-3 px-4 pt-4">
        <Text type="h5">{t('sectioned.reviewTitle', { title: sectionTitle(section.order) })}</Text>
        <Text type="body-sm" color="muted">
          {t('sectioned.reviewSummary', {
            answered: items.length - unansweredCount,
            total: items.length,
            flagged: flaggedCount,
          })}
        </Text>
        <SegmentedControl
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: 'ALL', label: t('sectioned.filterAll') },
            { value: 'FLAGGED', label: t('sectioned.filterFlagged', { count: flaggedCount }) },
            {
              value: 'UNANSWERED',
              label: t('sectioned.filterUnanswered', { count: unansweredCount }),
            },
          ]}
        />
      </View>
      <FlashList
        data={shown}
        numColumns={5}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReviewCell
            id={item.id}
            number={item.number}
            answered={item.answered}
            flagged={item.flagged}
            onPress={open}
          />
        )}
        ListEmptyComponent={
          <Text color="muted" className="p-6 text-center">
            {t('sectioned.reviewEmpty')}
          </Text>
        }
        contentContainerStyle={{ padding: 12 }}
      />
      <ActionBar>
        <GradientButton
          className="flex-1"
          icon={hasNext ? 'checkmark-done' : 'paper-plane-outline'}
          label={
            hasNext
              ? t('sectioned.endSectionNamed', { title: sectionTitle(section.order) })
              : t('attempt.submit')
          }
          onPress={confirmEnd}
        />
      </ActionBar>
    </View>
  );
}

type ReviewCellProps = {
  id: string;
  number: number;
  answered: boolean;
  flagged: boolean;
  onPress: (id: string) => void;
};

// Grid item: primitive props only.
function ReviewCell({ id, number, answered, flagged, onPress }: ReviewCellProps) {
  const warning = useThemeColor('warning');
  return (
    <View className="p-1.5">
      <PressableFeedback
        onPress={() => onPress(id)}
        accessibilityRole="button"
        className={`aspect-square items-center justify-center rounded-2xl border ${
          flagged
            ? 'border-warning bg-warning-soft'
            : answered
              ? 'border-transparent bg-accent-soft'
              : 'border-border bg-surface'
        }`}
      >
        <Text
          weight="semibold"
          className={
            flagged
              ? 'text-warning-soft-foreground'
              : answered
                ? 'text-accent-soft-foreground'
                : 'text-muted'
          }
        >
          {number}
        </Text>
        {flagged ? (
          <View className="absolute top-1 right-1">
            <Ionicons name="flag" size={12} color={warning} />
          </View>
        ) : null}
      </PressableFeedback>
    </View>
  );
}
