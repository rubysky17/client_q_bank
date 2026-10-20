import type { VocabEntry } from '@/vocab/merge';
import { termKey } from '@/vocab/term';

import { filterCounts, foldText, letterOf, matchesQuery, vocabRows } from './rows';

const entry = (term: string, patch: Partial<VocabEntry> = {}): VocabEntry => ({
  key: termKey(term),
  term,
  kind: 'WORD',
  meaning: null,
  partOfSpeech: null,
  explanation: null,
  context: null,
  sourceTitle: null,
  deleted: false,
  translateFailed: false,
  createdAt: 1,
  updatedAt: 1,
  ...patch,
});

const ENTRIES = [
  entry('stakeholder', { meaning: 'Bên liên quan' }),
  entry('Scope creep', { kind: 'PHRASE', meaning: 'Phình phạm vi' }),
  entry('baseline', { meaning: 'đường cơ sở' }),
  entry('agile'),
  entry('Éclat'),
  entry('3-point estimate', { kind: 'PHRASE' }),
  entry('risk', { deleted: true }),
  entry('The team agreed to the change request before work began.', { kind: 'SENTENCE' }),
];

describe('foldText', () => {
  it('drops case and accents, Vietnamese included', () => {
    expect(foldText('Đường Cơ Sở')).toBe('duong co so');
    expect(foldText('  Éclat ')).toBe('eclat');
  });
});

describe('matchesQuery', () => {
  it('finds the term or the meaning, ignoring case and accents', () => {
    const note = entry('Stakeholder', { meaning: 'Bên liên quan' });
    expect(matchesQuery(note, 'STAKE')).toBe(true);
    expect(matchesQuery(note, 'lien quan')).toBe(true);
    expect(matchesQuery(note, 'risk')).toBe(false);
    expect(matchesQuery(note, '  ')).toBe(true);
    expect(matchesQuery(entry('agile'), 'nhanh')).toBe(false);
  });
});

describe('letterOf', () => {
  it('groups by the first letter without accents, digits under #', () => {
    expect(letterOf('éclat')).toBe('E');
    expect(letterOf('baseline')).toBe('B');
    expect(letterOf('3-point estimate')).toBe('#');
  });
});

describe('filterCounts', () => {
  it('counts shown notes per kind within the search', () => {
    const shown = ENTRIES.filter((e) => !e.deleted);
    expect(filterCounts(shown, '')).toEqual({ all: 7, WORD: 4, PHRASE: 2, SENTENCE: 1 });
    expect(filterCounts(shown, 'pham vi')).toEqual({ all: 1, WORD: 0, PHRASE: 1, SENTENCE: 0 });
  });
});

describe('vocabRows', () => {
  it('sorts A–Z with a sticky letter row before each group, skipping deleted notes', () => {
    const { rows, stickyIndices } = vocabRows(ENTRIES, 'all', '');
    expect(rows.map((row) => (row.kind === 'letter' ? row.letter : row.entry.term))).toEqual([
      '#',
      '3-point estimate',
      'A',
      'agile',
      'B',
      'baseline',
      'E',
      'Éclat',
      'S',
      'Scope creep',
      'stakeholder',
      'T',
      'The team agreed to the change request before work began.',
    ]);
    expect(stickyIndices).toEqual([0, 2, 4, 6, 8, 11]);
    expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
  });

  it('applies the kind filter and the search', () => {
    const phrases = vocabRows(ENTRIES, 'PHRASE', '');
    expect(phrases.rows.filter((row) => row.kind === 'entry')).toHaveLength(2);
    const search = vocabRows(ENTRIES, 'all', 'co so');
    expect(search.rows.map((row) => row.key)).toEqual(['letter:baseline', 'baseline']);
    expect(search.stickyIndices).toEqual([0]);
  });

  it('is empty when nothing matches', () => {
    expect(vocabRows(ENTRIES, 'SENTENCE', 'stakeholder')).toEqual({ rows: [], stickyIndices: [] });
  });
});
