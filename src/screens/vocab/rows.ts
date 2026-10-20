/** Vocabulary list: search, kind filter and the A–Z groups with their sticky letters (pure). */
import { sortEntries, type VocabEntry } from '@/vocab/merge';

export const VOCAB_FILTERS = ['all', 'WORD', 'PHRASE', 'SENTENCE'] as const;
export type VocabFilter = (typeof VOCAB_FILTERS)[number];

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Lowercase, without accents ("Đánh giá" → "danh gia"): what search compares. */
export function foldText(text: string): string {
  const decomposed = typeof text.normalize === 'function' ? text.normalize('NFD') : text;
  return decomposed.replace(COMBINING_MARKS, '').replace(/[đĐ]/g, 'd').toLowerCase().trim();
}

/** The term or its meaning contains the query, ignoring case and accents. */
export function matchesQuery(entry: Pick<VocabEntry, 'term' | 'meaning'>, query: string) {
  const folded = foldText(query);
  if (folded === '') return true;
  return (
    foldText(entry.term).includes(folded) ||
    (entry.meaning !== null && foldText(entry.meaning).includes(folded))
  );
}

/** Notes matching the search, per filter (the counts shown on the filter). */
export function filterCounts(entries: readonly VocabEntry[], query: string) {
  const counts: Record<VocabFilter, number> = { all: 0, WORD: 0, PHRASE: 0, SENTENCE: 0 };
  for (const entry of entries) {
    if (!matchesQuery(entry, query)) continue;
    counts.all += 1;
    counts[entry.kind] += 1;
  }
  return counts;
}

/** Group letter of a term: A–Z without accents, `#` for anything else (digits). */
export function letterOf(term: string): string {
  const first = foldText(term).charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}

export type VocabRow =
  | { kind: 'letter'; key: string; letter: string }
  | { kind: 'entry'; key: string; entry: VocabEntry };

/**
 * Shown notes passing the filter and the search, A–Z, with a letter row before each group.
 * `stickyIndices` are the positions of the letter rows (FlashList `stickyHeaderIndices`).
 */
export function vocabRows(
  entries: readonly VocabEntry[],
  filter: VocabFilter,
  query: string,
): { rows: VocabRow[]; stickyIndices: number[] } {
  const shown = entries.filter(
    (entry) =>
      !entry.deleted && (filter === 'all' || entry.kind === filter) && matchesQuery(entry, query),
  );
  const rows: VocabRow[] = [];
  const stickyIndices: number[] = [];
  let letter: string | null = null;
  for (const entry of sortEntries(shown)) {
    const next = letterOf(entry.term);
    if (next !== letter) {
      letter = next;
      stickyIndices.push(rows.length);
      // Keyed by the first note of the group: unique even if a letter came back.
      rows.push({ kind: 'letter', key: `letter:${entry.key}`, letter: next });
    }
    rows.push({ kind: 'entry', key: entry.key, entry });
  }
  return { rows, stickyIndices };
}
