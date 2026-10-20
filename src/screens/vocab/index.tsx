import Ionicons from '@expo/vector-icons/Ionicons';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { syncVocab } from '@/api/vocab-sync';
import {
  EmptyView,
  SearchField,
  SegmentedControl,
  Text,
  useTabScrollInsets,
  useThemeColor,
} from '@/components/ui';
import { meaningStatus, useDeleteVocabNote, useIsOnline } from '@/components/vocab';
import {
  retryVocabTranslation,
  usePendingVocabCount,
  useVocabEntries,
  useVocabStore,
  useVocabSyncIssue,
} from '@/stores/vocab-store';
import { activeEntries } from '@/vocab/merge';

import { filterCounts, VOCAB_FILTERS, type VocabFilter, vocabRows } from './rows';
import { VocabDetailSheet } from './vocab-detail-sheet';
import { VocabRow } from './vocab-row';

/** Pulls notes and translations made elsewhere each time the tab is opened (module function: stable). */
function syncOnFocus() {
  void syncVocab();
}

/** The user's vocabulary: every noted word, phrase and sentence, A–Z, searchable. */
export function VocabScreen() {
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const { contentInsetAdjustmentBehavior } = useTabScrollInsets();
  const entries = useVocabEntries();
  const isOnline = useIsOnline();
  const syncIssue = useVocabSyncIssue();
  const deleteNote = useDeleteVocabNote();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<VocabFilter>('all');
  const [detail, setDetail] = useState({ key: null as string | null, openCount: 0, isOpen: false });
  useFocusEffect(syncOnFocus);

  const notes = activeEntries(entries);
  const counts = filterCounts(notes, query);
  const { rows, stickyIndices } = vocabRows(notes, filter, query);

  // Updater functions: rows may keep an older render's callbacks.
  const openDetail = (key: string) =>
    setDetail((previous) => ({ key, openCount: previous.openCount + 1, isOpen: true }));

  return (
    <View className="flex-1 bg-background">
      {/* Fixed above the list: the search stays at hand and the letters stick under it. */}
      <View className="gap-3 px-4 pb-3" style={{ paddingTop: top + 12 }}>
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text type="h2">{t('vocab.title')}</Text>
            <SyncStatus />
          </View>
          <Text type="body-sm" weight="medium" color="muted">
            {t('vocab.count', { count: notes.length })}
          </Text>
        </View>
        {notes.length > 0 ? (
          <>
            <SearchField value={query} onChange={setQuery}>
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input
                  placeholder={t('vocab.search')}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <SegmentedControl
              value={filter}
              onValueChange={setFilter}
              options={VOCAB_FILTERS.map((value) => ({
                value,
                label: `${t(`vocab.filter.${value}`)} ${counts[value]}`,
              }))}
            />
          </>
        ) : null}
      </View>

      <FlashList
        data={rows}
        keyExtractor={(row) => row.key}
        getItemType={(row) => row.kind}
        stickyHeaderIndices={stickyIndices}
        extraData={`${isOnline}:${syncIssue}`}
        renderItem={({ item }) =>
          item.kind === 'letter' ? (
            // Sticky rows are drawn outside the list's padding: each row pads itself.
            <View className="bg-background px-4 pt-2 pb-1.5">
              <Text type="body-xs" weight="semibold" color="muted">
                {item.letter}
              </Text>
            </View>
          ) : (
            <View className="px-4 pb-2">
              <VocabRow
                entryKey={item.entry.key}
                term={item.entry.term}
                kind={item.entry.kind}
                partOfSpeech={item.entry.partOfSpeech}
                meaning={item.entry.meaning}
                status={meaningStatus(item.entry, isOnline, syncIssue)}
                context={item.entry.context}
                onPress={openDetail}
                onDelete={deleteNote}
                onRetry={retryVocabTranslation}
              />
            </View>
          )
        }
        ListEmptyComponent={
          notes.length === 0 ? (
            <View className="items-center gap-1 px-6">
              <EmptyView message={t('vocab.empty')} />
              <Text type="body-sm" color="muted" align="center">
                {t('vocab.emptyHint')}
              </Text>
            </View>
          ) : (
            <EmptyView message={t('vocab.noMatch')} />
          )
        }
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior={contentInsetAdjustmentBehavior}
        contentContainerStyle={{ paddingBottom: 24 }}
      />

      <VocabDetailSheet
        entryKey={detail.key}
        openCount={detail.openCount}
        isOpen={detail.isOpen}
        onOpenChange={(isOpen) => setDetail((previous) => ({ ...previous, isOpen }))}
        onDelete={deleteNote}
      />
    </View>
  );
}

/** "Syncing…", "3 items waiting to sync" or "Synced". */
function SyncStatus() {
  const { t } = useTranslation();
  const isSyncing = useVocabStore((s) => s.syncing);
  const pending = usePendingVocabCount();
  const muted = useThemeColor('muted');

  const [icon, label] = isSyncing
    ? (['sync-outline', t('vocab.syncing')] as const)
    : pending > 0
      ? (['cloud-upload-outline', t('vocab.pending', { count: pending })] as const)
      : (['cloud-done-outline', t('vocab.synced')] as const);

  return (
    <View className="flex-row items-center gap-1.5" accessibilityLiveRegion="polite">
      <Ionicons name={icon} size={14} color={muted} />
      <Text type="body-xs" color="muted">
        {label}
      </Text>
    </View>
  );
}
