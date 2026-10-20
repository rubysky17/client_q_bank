import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions, View } from 'react-native';

import { scheduleVocabSync } from '@/api/vocab-sync';
import { ActionBar, Button, GradientButton, Text, useToast } from '@/components/ui';
import { noteTerm } from '@/stores/vocab-store';
import { MAX_TERM_LENGTH, normalizeTerm, sentenceAround } from '@/vocab/term';

import { selectedText } from './selection';
import {
  clearVocabSelection,
  showSavedVocabNote,
  useVocabSelection,
  useVocabSourceTitle,
} from './vocab-ui-store';

type NoteSelectionBarProps = {
  /** The screen's own bottom bar, shown while nothing is selected. */
  children: ReactNode;
};

/**
 * Bottom bar of a question screen: while words are selected in note mode, the selection with
 * Cancel and Save replaces the screen's own bar (`children`). Saving keeps note mode on and opens
 * the new note's tooltip, where "Translating…" turns into the meaning.
 */
export function NoteSelectionBar({ children }: NoteSelectionBarProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const selection = useVocabSelection();
  const sourceTitle = useVocabSourceTitle();
  const { width, height } = useWindowDimensions();

  if (!selection) return children;

  const term = selectedText(selection);
  const preview = normalizeTerm(term);
  const isTooLong = preview.length > MAX_TERM_LENGTH;

  const save = () => {
    const key = noteTerm({
      term,
      context: sentenceAround(selection.text, selection.start, selection.end),
      sourceTitle,
    });
    if (key === null) {
      toast.show({ label: t('vocab.tooLong'), variant: 'warning' });
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // No tap to anchor it (the text scrolled since): just above this bar.
    showSavedVocabNote(key, { x: width / 2, y: height - 160 });
    // Upload now rather than after the usual delay, so the translation comes back quickly.
    scheduleVocabSync(300);
  };

  return (
    <ActionBar direction="column">
      <View className="gap-1">
        <Text type="body-sm" weight="medium" numberOfLines={2}>
          {`“${preview}”`}
        </Text>
        {isTooLong ? (
          <Text type="body-xs" className="text-danger">
            {t('vocab.tooLong')}
          </Text>
        ) : null}
      </View>
      <View className="flex-row items-center gap-3">
        <Button variant="secondary" className="flex-1" onPress={clearVocabSelection}>
          <Button.Label>{t('common.cancel')}</Button.Label>
        </Button>
        <GradientButton
          className="flex-1"
          icon="bookmark-outline"
          label={t('vocab.save')}
          isDisabled={isTooLong}
          onPress={save}
        />
      </View>
    </ActionBar>
  );
}
