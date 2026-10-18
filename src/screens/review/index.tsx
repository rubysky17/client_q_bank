import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { type ReviewQuestion, useAttemptReview } from '@/api/attempts';
import {
  ActionBar,
  Button,
  EmptyView,
  ErrorView,
  GradientButton,
  IconButton,
  LoadingView,
} from '@/components/ui';

import { ReviewCard } from './review-card';
import {
  filterOptions,
  matches,
  NO_DOMAIN,
  NO_FILTERS,
  outcomeOf,
  type ReviewFilters,
  wasFlagged,
} from './review-filters';
import { type ActiveFilter, ReviewNavBar } from './review-nav-bar';
import { type MapItem, ReviewSheet } from './review-sheet';

type ReviewScreenProps = {
  id: string;
  /** Filters and question to start with (deep link from the result screen). */
  initialFilters?: ReviewFilters;
  initialQuestionId?: string;
};

export function ReviewScreen({ id, initialFilters, initialQuestionId }: ReviewScreenProps) {
  const { data: review, error, isPending, refetch } = useAttemptReview(id);

  if (isPending) return <LoadingView />;
  if (!review) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <ReviewPager
      questions={review.questions}
      initialFilters={initialFilters ?? NO_FILTERS}
      initialQuestionId={initialQuestionId}
    />
  );
}

type ReviewPagerProps = {
  questions: ReviewQuestion[];
  initialFilters: ReviewFilters;
  initialQuestionId: string | undefined;
};

/** One question at a time among those passing the filters; the sheet jumps to any of them. */
function ReviewPager({ questions, initialFilters, initialQuestionId }: ReviewPagerProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState(initialFilters);
  const [currentId, setCurrentId] = useState(initialQuestionId);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Number = position in the whole attempt, so "Câu 90" stays question 90 under any filter.
  const numbered = questions.map((question, index) => ({ question, number: index + 1 }));
  const shown = numbered.filter(({ question }) => matches(question, filters));
  const found = shown.findIndex(({ question }) => question.id === currentId);
  const index = found === -1 ? 0 : found;
  const current = shown[index];
  const options = filterOptions(questions);

  const goTo = (questionId: string | undefined) => setCurrentId(questionId);
  const applyFilters = (next: ReviewFilters) => {
    setFilters(next);
    // Stay on the question shown if it still matches, else open the first one that does.
    goTo(
      current && matches(current.question, next)
        ? current.question.id
        : numbered.find(({ question }) => matches(question, next))?.question.id,
    );
  };

  const tally = { correct: 0, wrong: 0, notAnswered: 0 };
  for (const { question } of shown) tally[outcomeOf(question)] += 1;

  const domainName = (domainId: string) =>
    domainId === NO_DOMAIN
      ? t('review.noDomain')
      : (options.domains.find((d) => d.value === domainId)?.label ?? domainId);
  const active: ActiveFilter[] = [
    ...filters.outcomes.map((value) => ({
      key: `o-${value}`,
      label: t(`review.${value}`),
      onRemove: () =>
        applyFilters({ ...filters, outcomes: filters.outcomes.filter((v) => v !== value) }),
    })),
    ...(filters.flagged
      ? [
          {
            key: 'flagged',
            label: t('review.flagged'),
            onRemove: () => applyFilters({ ...filters, flagged: false }),
          },
        ]
      : []),
    ...filters.difficulties.map((value) => ({
      key: `x-${value}`,
      label: t(`difficulty.${value}`),
      onRemove: () =>
        applyFilters({
          ...filters,
          difficulties: filters.difficulties.filter((v) => v !== value),
        }),
    })),
    ...filters.domainIds.map((value) => ({
      key: `d-${value}`,
      label: domainName(value),
      onRemove: () =>
        applyFilters({ ...filters, domainIds: filters.domainIds.filter((v) => v !== value) }),
    })),
    ...filters.sectionIds.map((value) => ({
      key: `s-${value}`,
      label: options.sections.find((s) => s.value === value)?.label ?? value,
      onRemove: () =>
        applyFilters({ ...filters, sectionIds: filters.sectionIds.filter((v) => v !== value) }),
    })),
  ];

  const items: MapItem[] = shown.map(({ question, number }) => ({
    id: question.id,
    number,
    outcome: outcomeOf(question),
    flagged: wasFlagged(question),
  }));

  return (
    <View className="flex-1">
      <ReviewNavBar
        number={current?.number ?? null}
        position={index + 1}
        shown={shown.length}
        tally={tally}
        active={active}
        onOpenSheet={() => setSheetOpen(true)}
      />
      {current ? (
        // Keyed by question so every question opens scrolled to the top.
        <ScrollView key={current.question.id} contentContainerClassName="p-4">
          <ReviewCard question={current.question} />
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center gap-2">
          <EmptyView message={t('review.noMatch')} />
          <Button variant="secondary" onPress={() => applyFilters(NO_FILTERS)}>
            <Button.Label>{t('review.clearFilters')}</Button.Label>
          </Button>
        </View>
      )}
      <ActionBar>
        <IconButton
          icon="chevron-back"
          size={48}
          isDisabled={index === 0 || !current}
          onPress={() => goTo(shown[index - 1]?.question.id)}
          accessibilityLabel={t('attempt.prev')}
        />
        <IconButton
          icon="grid-outline"
          size={48}
          onPress={() => setSheetOpen(true)}
          accessibilityLabel={t('review.filterAndMap')}
        />
        <GradientButton
          className="flex-1"
          icon="arrow-forward"
          iconEnd
          label={t('attempt.next')}
          isDisabled={index >= shown.length - 1}
          onPress={() => goTo(shown[index + 1]?.question.id)}
        />
      </ActionBar>
      <ReviewSheet
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        items={items}
        total={questions.length}
        currentId={current?.question.id}
        filters={filters}
        options={options}
        onFiltersChange={applyFilters}
        onSelect={(questionId) => {
          goTo(questionId);
          setSheetOpen(false);
        }}
      />
    </View>
  );
}
