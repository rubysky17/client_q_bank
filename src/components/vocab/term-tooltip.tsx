import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, Portal, Text, useThemeColor } from '@/components/ui';
import { retryVocabTranslation, useVocabEntry, useVocabSyncIssue } from '@/stores/vocab-store';

import { MeaningSheet } from './meaning-sheet';
import { meaningStatus } from './meaning-status';
import { PendingMeaning } from './pending-meaning';
import { placeTooltip } from './tooltip-position';
import { useDeleteVocabNote } from './use-delete-note';
import { useIsOnline } from './use-is-online';
import { closeVocabTooltip, useVocabTooltip, type VocabTooltip } from './vocab-ui-store';

/** Unique name of the tooltip in HeroUI's portal host (one tooltip at a time). */
const PORTAL_NAME = 'vocab-term-tooltip';

/**
 * The meaning of a noted term, in a bubble over the text (HeroUI `Portal`, so it floats above the
 * screen and its header). Rendered once per screen by `VocabScope`; opened by tapping a noted term
 * or by saving a selection. Any touch outside closes it, as do Android's back button, scrolling,
 * another question and pausing (the scope then unmounts).
 */
export function TermTooltip() {
  const tooltip = useVocabTooltip();
  const [sheet, setSheet] = useState({ key: null as string | null, openCount: 0, isOpen: false });

  const editMeaning = (key: string) => {
    closeVocabTooltip();
    setSheet((previous) => ({ key, openCount: previous.openCount + 1, isOpen: true }));
  };

  return (
    <>
      {tooltip ? (
        <Portal name={PORTAL_NAME}>
          {/* Keyed: every opening is measured and animated again. */}
          <TooltipLayer
            key={`${tooltip.key}:${tooltip.x}:${tooltip.y}`}
            tooltip={tooltip}
            onEditMeaning={editMeaning}
          />
        </Portal>
      ) : null}
      <MeaningSheet
        entryKey={sheet.key}
        openCount={sheet.openCount}
        isOpen={sheet.isOpen}
        onOpenChange={(isOpen) => setSheet((previous) => ({ ...previous, isOpen }))}
      />
    </>
  );
}

type TooltipLayerProps = {
  tooltip: VocabTooltip;
  onEditMeaning: (key: string) => void;
};

function TooltipLayer({ tooltip, onEditMeaning }: TooltipLayerProps) {
  const { t } = useTranslation();
  const entry = useVocabEntry(tooltip.key);
  const isOnline = useIsOnline();
  const syncIssue = useVocabSyncIssue();
  const deleteNote = useDeleteVocabNote();
  const success = useThemeColor('success');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState<number | null>(null);
  const progress = useSharedValue(0);
  const isMeasured = height !== null;

  // Shown once measured (its height decides above or below), with a short fade and scale.
  useEffect(() => {
    if (isMeasured) progress.set(withTiming(1, { duration: 160 }));
  }, [isMeasured, progress]);

  // Android back closes the tooltip first.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeVocabTooltip();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const place = placeTooltip({
    x: tooltip.x,
    y: tooltip.y,
    height: height ?? 0,
    windowWidth,
    windowHeight,
    safeTop: insets.top,
    safeBottom: insets.bottom,
  });
  const fromAbove = place.side === 'above';

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [
      { translateY: (1 - progress.get()) * (fromAbove ? 6 : -6) },
      { scale: 0.96 + progress.get() * 0.04 },
    ],
  }));

  // Deleted elsewhere (or undone sync): nothing to show.
  useEffect(() => {
    if (entry === undefined || entry.deleted) closeVocabTooltip();
  }, [entry]);
  if (!entry || entry.deleted) return null;

  const status = meaningStatus(entry, isOnline, syncIssue);

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      <Pressable
        className="absolute inset-0"
        onPressIn={closeVocabTooltip}
        accessibilityRole="button"
        accessibilityLabel={t('vocab.close')}
      />
      <Animated.View
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        accessibilityViewIsModal
        className="absolute gap-2 rounded-3xl border border-border bg-overlay p-4 shadow-overlay"
        style={[{ left: place.left, top: place.top, width: place.width }, animatedStyle]}
      >
        <View className="flex-row flex-wrap items-center gap-2">
          <Text weight="semibold" className="shrink" numberOfLines={3}>
            {entry.term}
          </Text>
          {entry.partOfSpeech ? (
            <Chip size="sm" variant="soft" color="default">
              <Chip.Label>{entry.partOfSpeech}</Chip.Label>
            </Chip>
          ) : null}
          {tooltip.isNew ? (
            <View className="ml-auto flex-row items-center gap-1">
              <Ionicons name="checkmark-circle" size={14} color={success} />
              <Text type="body-xs" weight="medium" className="text-success">
                {t('vocab.saved')}
              </Text>
            </View>
          ) : null}
        </View>

        {entry.meaning !== null ? (
          <Text type="h6" className="text-accent" numberOfLines={6}>
            {entry.meaning}
          </Text>
        ) : status === 'ready' ? null : (
          <PendingMeaning status={status} onRetry={() => retryVocabTranslation(entry.key)} />
        )}
        {entry.explanation ? (
          <Text type="body-sm" color="muted" numberOfLines={2}>
            {entry.explanation}
          </Text>
        ) : null}

        <View className="flex-row gap-2 pt-1">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onPress={() => onEditMeaning(entry.key)}
          >
            <Button.Label>
              {entry.meaning === null ? t('vocab.addMeaning') : t('vocab.editMeaning')}
            </Button.Label>
          </Button>
          <Button
            size="sm"
            variant="danger-soft"
            onPress={() => {
              closeVocabTooltip();
              deleteNote(entry.key);
            }}
          >
            <Button.Label>{t('vocab.delete')}</Button.Label>
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}
