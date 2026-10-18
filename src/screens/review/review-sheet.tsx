import Ionicons from '@expo/vector-icons/Ionicons';
import { useBottomSheetScrollableCreator } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet, FilterPill, PressableFeedback, Text, useThemeColor } from '@/components/ui';

import { VERDICT } from './review-card';
import {
  activeCount,
  type filterOptions,
  NO_DOMAIN,
  NO_FILTERS,
  type Outcome,
  type ReviewFilters,
  toggle,
} from './review-filters';

export type MapItem = { id: string; number: number; outcome: Outcome; flagged: boolean };

type ReviewSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Questions passing the filters, in attempt order. */
  items: MapItem[];
  total: number;
  currentId: string | undefined;
  filters: ReviewFilters;
  options: ReturnType<typeof filterOptions>;
  onFiltersChange: (filters: ReviewFilters) => void;
  onSelect: (id: string) => void;
};

/** Filters on top, then the grid of the matching questions: tap one to open it. */
export function ReviewSheet({ isOpen, onOpenChange, ...content }: ReviewSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        {/* Fixed height + no dynamic sizing, so the grid scrolls inside the sheet. */}
        <BottomSheet.Content
          snapPoints={['85%']}
          enableOverDrag={false}
          enableDynamicSizing={false}
          contentContainerClassName="h-full"
        >
          <SheetBody {...content} />
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}

function SheetBody({
  items,
  total,
  currentId,
  filters,
  options,
  onFiltersChange,
  onSelect,
}: Omit<ReviewSheetProps, 'isOpen' | 'onOpenChange'>) {
  const { t } = useTranslation();
  const renderScrollComponent = useBottomSheetScrollableCreator();

  return (
    <FlashList
      data={items}
      numColumns={6}
      keyExtractor={(item) => item.id}
      extraData={currentId}
      renderScrollComponent={renderScrollComponent}
      renderItem={({ item }) => (
        <MapCell
          id={item.id}
          number={item.number}
          outcome={item.outcome}
          flagged={item.flagged}
          isCurrent={item.id === currentId}
          onPress={onSelect}
        />
      )}
      ListHeaderComponent={
        <View className="gap-4 pb-3">
          <View className="flex-row items-center justify-between">
            <BottomSheet.Title>{t('review.filterAndMap')}</BottomSheet.Title>
            {activeCount(filters) > 0 ? (
              <PressableFeedback
                onPress={() => onFiltersChange(NO_FILTERS)}
                accessibilityRole="button"
                hitSlop={8}
              >
                <Text type="body-sm" weight="medium" className="text-accent">
                  {t('review.clearFilters')}
                </Text>
              </PressableFeedback>
            ) : null}
          </View>
          <FilterGroup title={t('review.outcome')}>
            {options.outcomes.map((o) => (
              <FilterPill
                key={o.value}
                label={`${t(`review.${o.value}`)} · ${o.count}`}
                isSelected={filters.outcomes.includes(o.value)}
                onPress={() =>
                  onFiltersChange({ ...filters, outcomes: toggle(filters.outcomes, o.value) })
                }
              />
            ))}
            {options.flagged > 0 ? (
              <FilterPill
                label={`${t('review.flagged')} · ${options.flagged}`}
                isSelected={filters.flagged}
                onPress={() => onFiltersChange({ ...filters, flagged: !filters.flagged })}
              />
            ) : null}
          </FilterGroup>
          <FilterGroup title={t('review.difficulty')}>
            {options.difficulties.map((d) => (
              <FilterPill
                key={d.value}
                label={`${t(`difficulty.${d.value}`)} · ${d.count}`}
                isSelected={filters.difficulties.includes(d.value)}
                onPress={() =>
                  onFiltersChange({
                    ...filters,
                    difficulties: toggle(filters.difficulties, d.value),
                  })
                }
              />
            ))}
          </FilterGroup>
          {options.domains.length > 1 ? (
            <FilterGroup title={t('review.domain')}>
              {options.domains.map((d) => (
                <FilterPill
                  key={d.value}
                  label={`${d.value === NO_DOMAIN ? t('review.noDomain') : d.label} · ${d.count}`}
                  isSelected={filters.domainIds.includes(d.value)}
                  onPress={() =>
                    onFiltersChange({ ...filters, domainIds: toggle(filters.domainIds, d.value) })
                  }
                />
              ))}
            </FilterGroup>
          ) : null}
          {options.sections.length > 1 ? (
            <FilterGroup title={t('review.section')}>
              {options.sections.map((s) => (
                <FilterPill
                  key={s.value}
                  label={`${s.label} · ${s.count}`}
                  isSelected={filters.sectionIds.includes(s.value)}
                  onPress={() =>
                    onFiltersChange({
                      ...filters,
                      sectionIds: toggle(filters.sectionIds, s.value),
                    })
                  }
                />
              ))}
            </FilterGroup>
          ) : null}
          <Text type="body-sm" weight="semibold" className="pt-1">
            {t('review.questions', { shown: items.length, total })}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text color="muted" className="p-6 text-center">
          {t('review.noMatch')}
        </Text>
      }
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
    />
  );
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text type="body-xs" weight="semibold" color="muted" className="uppercase">
        {title}
      </Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

type MapCellProps = {
  id: string;
  number: number;
  outcome: Outcome;
  flagged: boolean;
  isCurrent: boolean;
  onPress: (id: string) => void;
};

// Grid item: primitive props only.
function MapCell({ id, number, outcome, flagged, isCurrent, onPress }: MapCellProps) {
  const { t } = useTranslation();
  const warning = useThemeColor('warning');
  const tone = VERDICT[outcome];

  return (
    <View className="p-1">
      <PressableFeedback
        onPress={() => onPress(id)}
        accessibilityRole="button"
        accessibilityLabel={`${t('question.number', { n: number })}, ${t(`review.${outcome}`)}`}
        accessibilityState={{ selected: isCurrent }}
        className={`aspect-square items-center justify-center rounded-xl border-2 ${tone.bg} ${
          isCurrent ? 'border-accent' : 'border-transparent'
        }`}
      >
        <Text type="body-sm" weight="semibold" className={tone.fg}>
          {String(number)}
        </Text>
        {flagged ? (
          <View className="absolute top-0.5 right-0.5">
            <Ionicons name="flag" size={10} color={warning} />
          </View>
        ) : null}
      </PressableFeedback>
    </View>
  );
}
