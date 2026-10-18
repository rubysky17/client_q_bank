import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Difficulty } from '@/api/attempts';
import {
  type BankFacets,
  type BankFilters,
  useBankFacets,
  useBankQuestions,
} from '@/api/question-bank';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCSSVariable } from 'uniwind';

import {
  EmptyView,
  ErrorView,
  FilterPill,
  GradientGlow,
  GradientView,
  LoadingView,
  PressableFeedback,
  Spinner,
  Text,
  toneFor,
} from '@/components/ui';

import { BankRow } from './bank-row';
import { toParams } from './filters';

/** Every published question, filterable by exam, section, domain and difficulty. */
export function BankScreen() {
  const { t } = useTranslation();
  const { push } = useRouter();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<BankFilters>({});
  const { data: facets, error: facetsError, refetch: refetchFacets } = useBankFacets();
  const { data, error, isPending, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useBankQuestions(filters);

  const practice = (start: number) =>
    push({ pathname: '/practice', params: toParams(filters, start) });

  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  };

  if (!facets) {
    return facetsError ? (
      <ErrorView error={facetsError} onRetry={refetchFacets} />
    ) : (
      <LoadingView />
    );
  }

  const header = (
    <View className="gap-4 pb-4">
      <View>
        <Text type="h2">{t('bank.title')}</Text>
        <Text type="body-sm" color="muted">
          {t('bank.subtitle')}
        </Text>
      </View>
      <PracticeCard
        count={data?.total ?? null}
        onPress={data && data.total > 0 ? () => practice(0) : undefined}
      />
      <FilterBar facets={facets} filters={filters} onChange={setFilters} />
    </View>
  );

  return (
    <FlashList
      data={data?.items ?? []}
      keyExtractor={(question) => question.id}
      renderItem={({ item, index }) => (
        <BankRow
          index={index}
          tone={toneFor(item.domain?.id ?? item.examTitle)}
          label={`${item.examTitle} · ${item.sectionTitle} · ${t('question.number', {
            n: item.sourceNumber ?? item.order,
          })}`}
          preview={item.content}
          domain={item.domain?.name ?? null}
          difficultyLabel={t(`difficulty.${item.difficulty}`)}
          hasCaseStudy={item.caseStudy !== null}
          hasMedia={item.media.some((media) => media.placement === 'CONTENT')}
          onPress={practice}
        />
      )}
      ItemSeparatorComponent={Gap}
      ListHeaderComponent={header}
      ListEmptyComponent={
        isPending ? (
          <Spinner className="my-6 self-center" />
        ) : error ? (
          <ErrorView error={error} onRetry={refetch} />
        ) : (
          <EmptyView message={t('bank.empty')} />
        )
      }
      ListFooterComponent={isFetchingNextPage ? <Spinner className="my-6 self-center" /> : null}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingHorizontal: 16,
        paddingBottom: 24,
      }}
    />
  );
}

type FilterBarProps = {
  facets: BankFacets;
  filters: BankFilters;
  onChange: (filters: BankFilters) => void;
};

function FilterBar({ facets, filters, onChange }: FilterBarProps) {
  const { t } = useTranslation();
  const exam = facets.exams.find((e) => e.id === filters.examId);

  return (
    <View className="gap-2">
      <ChipRow
        options={facets.exams.map((e) => ({ value: e.id, label: e.title }))}
        value={filters.examId}
        allLabel={t('bank.allExams')}
        // Sections belong to one exam: changing the exam resets the section.
        onSelect={(examId) => onChange({ ...filters, examId, sectionId: undefined })}
      />
      {exam ? (
        <ChipRow
          options={exam.sections.map((s) => ({ value: s.id, label: s.title }))}
          value={filters.sectionId}
          allLabel={t('bank.allSections')}
          onSelect={(sectionId) => onChange({ ...filters, sectionId })}
        />
      ) : null}
      <ChipRow
        options={facets.domains.map((d) => ({ value: d.id, label: d.name }))}
        value={filters.domainId}
        allLabel={t('bank.allDomains')}
        onSelect={(domainId) => onChange({ ...filters, domainId })}
      />
      <ChipRow
        options={facets.difficulties.map((d) => ({
          value: d.difficulty,
          label: t(`difficulty.${d.difficulty}`),
        }))}
        value={filters.difficulty}
        allLabel={t('bank.allDifficulties')}
        onSelect={(difficulty) =>
          onChange({ ...filters, difficulty: difficulty as Difficulty | undefined })
        }
      />
    </View>
  );
}

type ChipRowProps = {
  options: { value: string; label: string }[];
  value: string | undefined;
  allLabel: string;
  onSelect: (value: string | undefined) => void;
};

/** One filter: "All" plus one chip per value, scrolling sideways. */
function ChipRow({ options, value, allLabel, onSelect }: ChipRowProps) {
  const choices = [{ value: undefined, label: allLabel }, ...options];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {choices.map((choice) => {
        const isSelected = choice.value === value;
        return (
          <FilterPill
            key={choice.value ?? 'all'}
            label={choice.label}
            isSelected={isSelected}
            onPress={() => onSelect(choice.value)}
          />
        );
      })}
    </ScrollView>
  );
}

function Gap() {
  return <View className="h-3" />;
}

type PracticeCardProps = {
  /** Questions matching the filters; null while loading. */
  count: number | null;
  /** Undefined when there is nothing to practice. */
  onPress?: () => void;
};

/** Gradient call to action: practice the filtered questions with explanations. */
function PracticeCard({ count, onPress }: PracticeCardProps) {
  const { t } = useTranslation();
  const [onBrand, brandEnd] = useCSSVariable(['--color-on-brand', '--color-brand-end']);

  return (
    <GradientView className="gap-3 rounded-3xl p-5">
      <GradientGlow className="-top-16 -right-10 size-44" />
      <View className="flex-row items-center gap-1 self-start rounded-full bg-on-brand-subtle px-2 py-1">
        <Ionicons
          name="sparkles"
          size={12}
          color={typeof onBrand === 'string' ? onBrand : undefined}
        />
        <Text type="body-xs" weight="semibold" className="text-on-brand">
          {t('bank.eyebrow')}
        </Text>
      </View>
      <Text type="h4" className="text-on-brand">
        {count === null ? ' ' : t('bank.count', { count })}
      </Text>
      <Text type="body-sm" className="text-on-brand-muted">
        {t('bank.cardHint')}
      </Text>
      {onPress ? (
        <PressableFeedback
          onPress={onPress}
          accessibilityRole="button"
          className="h-11 flex-row items-center gap-2 self-start rounded-full bg-on-brand px-5"
        >
          <Ionicons
            name="play"
            size={16}
            color={typeof brandEnd === 'string' ? brandEnd : undefined}
          />
          <Text weight="medium" className="text-brand-end">
            {t('bank.practice')}
          </Text>
        </PressableFeedback>
      ) : null}
    </GradientView>
  );
}
