import {
  createVocabScopeId,
  enterVocabScope,
  leaveVocabScope,
  pressVocabWord,
  resetVocabView,
  setVocabNoteMode,
  showSavedVocabNote,
  toggleVocabNoteMode,
  useVocabUiStore,
} from './vocab-ui-store';

const TEXT = 'Identify the key stakeholders early.';
const word = (value: string) => {
  const start = TEXT.indexOf(value);
  return { start, end: start + value.length };
};
const state = () => useVocabUiStore.getState();

describe('vocab ui store', () => {
  const opened: number[] = [];
  const open = (title: string) => {
    const id = createVocabScopeId();
    opened.push(id);
    enterVocabScope(id, title);
    return id;
  };

  afterEach(() => {
    for (const id of opened.splice(0)) leaveVocabScope(id);
  });

  it('activates the newest scope and gives the previous one back when it ends', () => {
    const review = open('Exam A');
    setVocabNoteMode(true);
    const practice = open('Practice');
    expect(state().scope?.sourceTitle).toBe('Practice');
    // The new screen starts without note mode.
    expect(state().noteMode).toBe(false);

    leaveVocabScope(practice);
    expect(state().scope?.id).toBe(review);
    leaveVocabScope(review);
    expect(state().scope).toBeNull();
  });

  it('renames a scope in place and keeps note mode', () => {
    const id = open('Exam A');
    setVocabNoteMode(true);
    enterVocabScope(id, 'Exam B');
    expect(state().scope).toEqual({ id, sourceTitle: 'Exam B' });
    expect(state().noteMode).toBe(true);
  });

  it('ignores the end of a scope that is not the active one', () => {
    const below = open('Below');
    open('Top');
    setVocabNoteMode(true);
    leaveVocabScope(below);
    expect(state().scope?.sourceTitle).toBe('Top');
    expect(state().noteMode).toBe(true);
  });

  it('clears note mode, selection and tooltip when the scope ends', () => {
    const id = open('Exam');
    setVocabNoteMode(true);
    pressVocabWord('q1:stem:0', TEXT, word('key'), { x: 10, y: 20 });
    leaveVocabScope(id);
    expect(state()).toMatchObject({ noteMode: false, selection: null, tooltip: null });
  });

  it('builds the selection from taps and drops it when note mode turns off', () => {
    open('Exam');
    toggleVocabNoteMode();
    pressVocabWord('b', TEXT, word('key'), { x: 1, y: 2 });
    pressVocabWord('b', TEXT, word('stakeholders'), { x: 3, y: 4 });
    expect(state().selection).toMatchObject({ blockId: 'b', ...word('key stakeholders') });
    expect(state().lastTap).toEqual({ x: 3, y: 4 });

    toggleVocabNoteMode();
    expect(state()).toMatchObject({ noteMode: false, selection: null, lastTap: null });
  });

  it('opens the tooltip of a saved note where the user last tapped', () => {
    open('Exam');
    setVocabNoteMode(true);
    pressVocabWord('b', TEXT, word('key'), { x: 30, y: 400 });
    showSavedVocabNote('key', { x: 0, y: 0 });
    expect(state().selection).toBeNull();
    expect(state().tooltip).toEqual({ key: 'key', x: 30, y: 400, isNew: true });

    resetVocabView();
    showSavedVocabNote('key', { x: 5, y: 6 });
    expect(state().tooltip).toEqual({ key: 'key', x: 5, y: 6, isNew: true });
    expect(state().noteMode).toBe(true);
  });
});
