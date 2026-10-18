import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { PressableFeedback, Text, useThemeColor } from '@/components/ui';

import { VERDICT } from './review-card';
import type { Outcome } from './review-filters';

export type ActiveFilter = { key: string; label: string; onRemove: () => void };

type ReviewNavBarProps = {
  /** Position in the attempt (1-based) of the question shown, null when none matches. */
  number: number | null;
  /** Position among the matching questions (1-based). */
  position: number;
  shown: number;
  tally: Record<Outcome, number>;
  active: ActiveFilter[];
  onOpenSheet: () => void;
};

/** Where the user is in the (filtered) review, the filters in force and the way to the map. */
export function ReviewNavBar({
  number,
  position,
  shown,
  tally,
  active,
  onOpenSheet,
}: ReviewNavBarProps) {
  const { t } = useTranslation();
  const [foreground, muted] = useThemeColor(['foreground', 'muted']);

  return (
    <View className="gap-2 border-b border-border bg-background pt-2 pb-3">
      <View className="flex-row items-center gap-3 px-4">
        <View className="flex-1 flex-row items-baseline gap-1.5">
          <Text type="h5">{number === null ? '—' : t('question.number', { n: number })}</Text>
          {shown > 0 ? (
            <Text type="body-sm" color="muted">
              {t('review.position', { current: position, total: shown })}
            </Text>
          ) : null}
        </View>
        <PressableFeedback
          onPress={onOpenSheet}
          accessibilityRole="button"
          accessibilityLabel={t('review.filterAndMap')}
          className="h-10 flex-row items-center gap-1.5 rounded-full border border-border bg-surface px-3.5"
        >
          <Ionicons name="grid-outline" size={16} color={foreground} />
          <Text type="body-sm" weight="medium">
            {t('review.list')}
          </Text>
          {active.length > 0 ? (
            <View className="min-w-5 items-center rounded-full bg-accent px-1.5">
              <Text type="body-xs" weight="semibold" className="text-accent-foreground">
                {String(active.length)}
              </Text>
            </View>
          ) : (
            <Ionicons name="options-outline" size={16} color={muted} />
          )}
        </PressableFeedback>
      </View>
      <View className="flex-row gap-2 px-4">
        <TallyPill tone="correct" value={tally.correct} label={t('review.correct')} />
        <TallyPill tone="wrong" value={tally.wrong} label={t('review.wrong')} />
        <TallyPill tone="notAnswered" value={tally.notAnswered} label={t('review.notAnswered')} />
      </View>
      {active.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-4"
        >
          {active.map((filter) => (
            <PressableFeedback
              key={filter.key}
              onPress={filter.onRemove}
              accessibilityRole="button"
              accessibilityLabel={t('review.removeFilter', { label: filter.label })}
              className="flex-row items-center gap-1 rounded-full bg-accent-soft py-1 pr-2 pl-3"
            >
              <Text type="body-xs" weight="medium" className="text-accent-soft-foreground">
                {filter.label}
              </Text>
              <Ionicons name="close" size={14} color={muted} />
            </PressableFeedback>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function TallyPill({ tone, value, label }: { tone: Outcome; value: number; label: string }) {
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${VERDICT[tone].bg}`}>
      <Text type="body-xs" weight="semibold" className={VERDICT[tone].fg}>
        {`${label} ${value}`}
      </Text>
    </View>
  );
}
