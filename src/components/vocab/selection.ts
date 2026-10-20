/**
 * Word-by-word selection of note mode (pure). React Native gives no character range for a free
 * text selection, so the user builds one by tapping words: offsets are into one block's text.
 */
import { expandToWords, sentenceAround } from '@/vocab/term';

/** What is selected: `[start, end)` of `text`, the whole text of block `blockId`. */
export type VocabSelection = {
  blockId: string;
  text: string;
  start: number;
  end: number;
};

/** A word of the block (token offsets). */
export type WordRange = { start: number; end: number };

/**
 * A tap on a word:
 * - nothing selected in this block (or a selection in another block) → that word;
 * - a word outside the selection → the range from the selection to that word (phrase, sentence);
 * - a word inside the selection → just that word, or nothing when it already was just that word.
 */
export function tapWord(
  current: VocabSelection | null,
  blockId: string,
  text: string,
  word: WordRange,
): VocabSelection | null {
  if (!current || current.blockId !== blockId || current.text !== text) {
    return { blockId, text, start: word.start, end: word.end };
  }
  const inside = word.start >= current.start && word.end <= current.end;
  if (inside) {
    const isThatWord = current.start === word.start && current.end === word.end;
    return isThatWord ? null : { blockId, text, start: word.start, end: word.end };
  }
  return {
    blockId,
    text,
    start: Math.min(current.start, word.start),
    end: Math.max(current.end, word.end),
  };
}

/** A long press on a word: the whole sentence around it (whole words, no final punctuation). */
export function longPressWord(blockId: string, text: string, word: WordRange): VocabSelection {
  const range = sentenceRange(text, word) ?? word;
  return { blockId, text, start: range.start, end: range.end };
}

/** The text that is selected, as written. */
export const selectedText = (selection: VocabSelection) =>
  selection.text.slice(selection.start, selection.end);

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Where `sentenceAround` found the sentence of `word`. It returns the sentence with its white
 * space collapsed (and trimmed to a few hundred characters around the word), so it is looked up
 * again in the text, allowing any white space between words.
 */
function sentenceRange(text: string, word: WordRange): WordRange | null {
  const sentence = sentenceAround(text, word.start, word.end);
  if (sentence === '') return null;
  const pattern = new RegExp(escapeRegExp(sentence).replace(/ /g, '\\s+'), 'g');
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const end = match.index + match[0].length;
    if (match.index <= word.start && end >= word.end) {
      return expandToWords(text, match.index, end);
    }
    if (match[0].length === 0) pattern.lastIndex += 1;
  }
  return null;
}
