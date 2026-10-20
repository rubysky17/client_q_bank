import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { IconButton, PressableFeedback, Text, useThemeColor } from '@/components/ui';

import { toggleVocabNoteMode, useNoteMode, useVocabScopeActive } from './vocab-ui-store';

type NoteToggleProps = {
  size?: number;
};

/**
 * The pencil of a question screen: turns note mode on and off (off drops the selection). Shown
 * only while a `VocabScope` is mounted.
 */
export function NoteToggle({ size }: NoteToggleProps) {
  const { t } = useTranslation();
  const isActive = useVocabScopeActive();
  const noteMode = useNoteMode();
  if (!isActive) return null;

  return (
    <IconButton
      icon="create-outline"
      size={size}
      isSelected={noteMode}
      onPress={toggleVocabNoteMode}
      accessibilityLabel={t('vocab.noteMode')}
    />
  );
}

/** One-line hint under the top bar while note mode is on; the reader can close it. */
export function NoteModeHint() {
  const { t } = useTranslation();
  const noteMode = useNoteMode();
  const isActive = useVocabScopeActive();
  const [isDismissed, setIsDismissed] = useState(false);
  const accentSoftForeground = useThemeColor('accent-soft-foreground');
  if (!isActive || !noteMode || isDismissed) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      className="mx-4 mb-2 flex-row items-center gap-2 rounded-2xl bg-accent-soft py-2 pr-2 pl-3"
    >
      <Ionicons name="create-outline" size={16} color={accentSoftForeground} />
      <Text type="body-xs" className="flex-1 text-accent-soft-foreground" numberOfLines={2}>
        {t('vocab.hintTap')}
      </Text>
      <PressableFeedback
        onPress={() => setIsDismissed(true)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t('vocab.close')}
        className="size-7 items-center justify-center rounded-full"
      >
        <Ionicons name="close" size={16} color={accentSoftForeground} />
      </PressableFeedback>
    </View>
  );
}
