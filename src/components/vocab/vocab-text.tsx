import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
// React Native's Text, not HeroUI's: nested in the paragraph's Text, it inherits its style.
import { type GestureResponderEvent, Platform, Text, type TextStyle } from 'react-native';

import { useThemeColor } from '@/components/ui';
import { useVocabMatcher } from '@/stores/vocab-store';
import { segment } from '@/vocab/matcher';
import { tokenize } from '@/vocab/term';

import {
  longPressVocabWord,
  openVocabTooltip,
  pressVocabWord,
  useBlockSelection,
  useNoteMode,
  useVocabScopeActive,
} from './vocab-ui-store';

type VocabTextProps = {
  /** The text of one block (paragraph, option…), as the parent Text would show it. */
  text: string;
  /** Unique on the screen, e.g. `${questionId}:stem:0`: a selection belongs to one block. */
  blockId: string;
};

/**
 * Question text with the vocabulary layer, rendered inside a parent `Text` (it returns nested
 * texts only, which inherit the parent's style).
 * - No `VocabScope` on screen: the text as is.
 * - Normal: noted terms are underlined; tapping one opens its tooltip.
 * - Note mode: every word can be tapped (select, extend, shrink) or long-pressed (sentence).
 */
export function VocabText({ text, blockId }: VocabTextProps) {
  const isActive = useVocabScopeActive();
  const noteMode = useNoteMode();

  if (!isActive) return text;
  if (noteMode) return <NoteModeWords text={text} blockId={blockId} />;
  return <NotedTerms text={text} />;
}

const pointOf = (event: GestureResponderEvent) => ({
  x: event.nativeEvent.pageX,
  y: event.nativeEvent.pageY,
});

/** Underline of noted terms: dashed on iOS; Android ignores the style and color of decorations. */
function useNotedStyle(): TextStyle {
  const accent = useThemeColor('accent');
  return Platform.OS === 'ios'
    ? {
        color: accent,
        textDecorationLine: 'underline',
        textDecorationStyle: 'dashed',
        textDecorationColor: accent,
      }
    : { color: accent, textDecorationLine: 'underline' };
}

function NotedTerms({ text }: { text: string }) {
  const matcher = useVocabMatcher();
  const notedStyle = useNotedStyle();
  const segments = segment(text, matcher);
  if (segments.every((part) => part.key === undefined)) return text;

  return (
    <>
      {segments.map((part) => {
        const key = part.key;
        return key === undefined ? (
          part.text
        ) : (
          <Text
            key={part.start}
            style={notedStyle}
            suppressHighlighting
            onPress={(event) => openVocabTooltip(key, pointOf(event))}
          >
            {part.text}
          </Text>
        );
      })}
    </>
  );
}

function NoteModeWords({ text, blockId }: VocabTextProps) {
  const selection = useBlockSelection(blockId);
  const matcher = useVocabMatcher();
  const notedStyle = useNotedStyle();
  const accentSoft = useThemeColor('accent-soft');
  const selectedStyle: TextStyle = { backgroundColor: accentSoft };
  const notedSelectedStyle: TextStyle = { ...notedStyle, backgroundColor: accentSoft };

  // Already noted words stay underlined, so the user sees what is in the list.
  const noted = segment(text, matcher).filter((part) => part.key !== undefined);
  const isSelected = (start: number, end: number) =>
    selection !== null && start >= selection.start && end <= selection.end;
  /** Spaces and punctuation: plain, or highlighted between selected words. */
  const gap = (start: number, end: number): ReactNode =>
    isSelected(start, end) ? (
      <Text key={`g${start}`} style={selectedStyle}>
        {text.slice(start, end)}
      </Text>
    ) : (
      text.slice(start, end)
    );

  const parts: ReactNode[] = [];
  let cursor = 0;
  let notedIndex = 0;
  for (const token of tokenize(text)) {
    if (token.start > cursor) parts.push(gap(cursor, token.start));
    // Both lists are in text order: move to the first noted term not ending before this word.
    while (notedIndex < noted.length && noted[notedIndex]!.end <= token.start) notedIndex += 1;
    const isNoted = (noted[notedIndex]?.start ?? Number.POSITIVE_INFINITY) <= token.start;
    const selected = isSelected(token.start, token.end);
    const word = { start: token.start, end: token.end };
    parts.push(
      <Text
        key={token.start}
        style={
          isNoted
            ? selected
              ? notedSelectedStyle
              : notedStyle
            : selected
              ? selectedStyle
              : undefined
        }
        suppressHighlighting
        accessibilityState={{ selected }}
        onPress={(event) => pressVocabWord(blockId, text, word, pointOf(event))}
        onLongPress={(event) => {
          void Haptics.selectionAsync();
          longPressVocabWord(blockId, text, word, pointOf(event));
        }}
      >
        {text.slice(token.start, token.end)}
      </Text>,
    );
    cursor = token.end;
  }
  if (cursor < text.length) parts.push(gap(cursor, text.length));
  return <>{parts}</>;
}
