import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  BottomSheet,
  Button,
  Description,
  Label,
  TextArea,
  TextField,
  useBottomSheetAwareHandlers,
} from '@/components/ui';
import { setVocabMeaning, useVocabEntry } from '@/stores/vocab-store';
import { MAX_MEANING } from '@/vocab/merge';

type MeaningFormProps = {
  entryKey: string;
  /** Saved or cancelled. */
  onDone: () => void;
  /** Shows the term as the title (the meaning sheet; the detail sheet already shows it). */
  showTerm?: boolean;
  /** Focus the field on mount: only when the sheet is already open (inline editing). */
  autoFocus?: boolean;
};

/**
 * Types or edits a note's meaning. Render it inside `BottomSheet.Content` (keyboard avoidance).
 * Save stays off while nothing changed. An empty meaning asks for a new translation, which only
 * applies to a note without one (the store keeps a known meaning).
 */
export function MeaningForm({
  entryKey,
  onDone,
  showTerm = false,
  autoFocus = false,
}: MeaningFormProps) {
  const { t } = useTranslation();
  const entry = useVocabEntry(entryKey);
  const [value, setValue] = useState(entry?.meaning ?? '');
  const { onFocus, onBlur } = useBottomSheetAwareHandlers();
  if (!entry) return null;

  const typed = value.trim();
  const current = entry.meaning?.trim() ?? '';
  const canSave =
    typed === '' ? entry.meaning === null && entry.translateFailed : typed !== current;

  const save = () => {
    setVocabMeaning(entryKey, typed);
    onDone();
  };

  return (
    <View className="gap-4">
      {showTerm ? <BottomSheet.Title numberOfLines={3}>{entry.term}</BottomSheet.Title> : null}
      <TextField>
        <Label>{t('vocab.meaning')}</Label>
        <TextArea
          value={value}
          onChangeText={setValue}
          placeholder={t('vocab.meaningPlaceholder')}
          onFocus={onFocus}
          onBlur={onBlur}
          maxLength={MAX_MEANING}
          autoFocus={autoFocus}
        />
        {entry.meaning === null ? <Description>{t('vocab.meaningHint')}</Description> : null}
      </TextField>
      <View className="flex-row gap-3">
        <Button variant="secondary" className="flex-1" onPress={onDone}>
          <Button.Label>{t('common.cancel')}</Button.Label>
        </Button>
        <Button className="flex-1" isDisabled={!canSave} onPress={save}>
          <Button.Label>{t('vocab.save')}</Button.Label>
        </Button>
      </View>
    </View>
  );
}

type MeaningSheetProps = {
  /** The note being edited; kept while the sheet closes so its content does not vanish. */
  entryKey: string | null;
  /** Bumped on every opening: the form starts again from the note's current meaning. */
  openCount: number;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

/** Bottom sheet around `MeaningForm` (from the term tooltip). */
export function MeaningSheet({ entryKey, openCount, isOpen, onOpenChange }: MeaningSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content keyboardBehavior="interactive">
          {entryKey ? (
            <MeaningForm
              key={`${entryKey}:${openCount}`}
              entryKey={entryKey}
              onDone={() => onOpenChange(false)}
              showTerm
            />
          ) : null}
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
}
