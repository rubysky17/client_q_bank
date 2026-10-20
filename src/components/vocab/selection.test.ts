import { tokenize } from '@/vocab/term';

import { longPressWord, selectedText, tapWord, type VocabSelection } from './selection';

const TEXT =
  'The project manager reviews the risk register. Then the team updates the schedule baseline!';

/** Offsets of the n-th occurrence of `word` in `text`. */
function wordAt(word: string, text = TEXT, nth = 0) {
  const found = tokenize(text).filter((token) => text.slice(token.start, token.end) === word);
  const token = found[nth];
  if (!token) throw new Error(`no "${word}" in text`);
  return { start: token.start, end: token.end };
}

const select = (block: string, from: string, to = from): VocabSelection => ({
  blockId: block,
  text: TEXT,
  start: wordAt(from).start,
  end: wordAt(to).end,
});

describe('tapWord', () => {
  it('selects the tapped word when nothing is selected', () => {
    const next = tapWord(null, 'q1:stem', TEXT, wordAt('risk'));
    expect(next && selectedText(next)).toBe('risk');
    expect(next?.blockId).toBe('q1:stem');
  });

  it('extends to a later word of the same block', () => {
    const next = tapWord(select('b', 'risk'), 'b', TEXT, wordAt('register'));
    expect(next && selectedText(next)).toBe('risk register');
  });

  it('extends to an earlier word of the same block', () => {
    const next = tapWord(select('b', 'risk'), 'b', TEXT, wordAt('project'));
    expect(next && selectedText(next)).toBe('project manager reviews the risk');
  });

  it('spans sentences', () => {
    const next = tapWord(select('b', 'register'), 'b', TEXT, wordAt('Then'));
    expect(next && selectedText(next)).toBe('register. Then');
  });

  it('collapses to the tapped word inside the selection', () => {
    const next = tapWord(select('b', 'project', 'reviews'), 'b', TEXT, wordAt('manager'));
    expect(next && selectedText(next)).toBe('manager');
  });

  it('clears when the selection was only the tapped word', () => {
    expect(tapWord(select('b', 'risk'), 'b', TEXT, wordAt('risk'))).toBeNull();
  });

  it('starts over in another block', () => {
    const next = tapWord(select('a', 'risk', 'register'), 'b', TEXT, wordAt('team'));
    expect(next).toEqual({ blockId: 'b', text: TEXT, ...wordAt('team') });
  });

  it('starts over when the block text changed', () => {
    const other = 'Risk register and issue log';
    const next = tapWord(select('b', 'risk'), 'b', other, wordAt('issue', other));
    expect(next && selectedText(next)).toBe('issue');
  });
});

describe('longPressWord', () => {
  it('selects the sentence without its final punctuation', () => {
    expect(selectedText(longPressWord('b', TEXT, wordAt('risk')))).toBe(
      'The project manager reviews the risk register',
    );
    expect(selectedText(longPressWord('b', TEXT, wordAt('baseline')))).toBe(
      'Then the team updates the schedule baseline',
    );
  });

  it('finds the sentence across line breaks and repeated spaces', () => {
    const text = 'Plan  the\twork.\nWork the   plan.';
    expect(selectedText(longPressWord('b', text, wordAt('work', text)))).toBe('Plan  the\twork');
    expect(selectedText(longPressWord('b', text, wordAt('plan', text)))).toBe('Work the   plan');
  });

  it('picks the occurrence that holds the word when a sentence repeats', () => {
    const text = 'Close the project. Close the project.';
    const second = wordAt('project', text, 1);
    const selection = longPressWord('b', text, second);
    expect(selection.start).toBe(text.lastIndexOf('Close'));
    expect(selectedText(selection)).toBe('Close the project');
  });

  it('keeps the word for a very long sentence and stays on whole words', () => {
    const text = `${'word '.repeat(120)}target ${'tail '.repeat(120)}end.`;
    const selection = longPressWord('b', text, wordAt('target', text));
    const chosen = selectedText(selection);
    expect(chosen).toContain('target');
    // About the 300 characters of the context sentence, grown to whole words.
    expect(chosen.length).toBeLessThan(text.length / 2);
    expect(chosen).toMatch(/^word .* tail$/);
  });
});
