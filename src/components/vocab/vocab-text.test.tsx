import '@/i18n';

import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { activateVocabUser, clearVocabUser, noteTerm } from '@/stores/vocab-store';

import {
  createVocabScopeId,
  enterVocabScope,
  leaveVocabScope,
  setVocabNoteMode,
  useVocabUiStore,
} from './vocab-ui-store';
import { VocabText } from './vocab-text';

// HeroUI pulls Reanimated's native runtime, which Jest lacks; only the theme color is used here.
jest.mock('@/components/ui', () => ({ useThemeColor: () => '#3366ff' }));

const USER = 'vocab-text-user';
const TEXT = 'Engage every stakeholder early. Then plan the work.';
const at = (x: number, y: number) => ({ nativeEvent: { pageX: x, pageY: y } });

function renderBlock() {
  return render(
    <Text testID="block">
      <VocabText text={TEXT} blockId="q1:stem:0" />
    </Text>,
  );
}

describe('VocabText', () => {
  let scopeId = 0;

  beforeEach(() => {
    clearVocabUser(USER);
    activateVocabUser(USER);
    noteTerm({ term: 'stakeholder' });
  });

  afterEach(async () => {
    await act(async () => leaveVocabScope(scopeId));
    activateVocabUser(null);
  });

  const openScope = () => {
    scopeId = createVocabScopeId();
    enterVocabScope(scopeId, 'Exam');
  };

  it('renders the plain text outside a vocabulary scope', async () => {
    await renderBlock();
    expect(screen.getByTestId('block')).toHaveTextContent(TEXT);
    expect(screen.queryByText('stakeholder')).toBeNull();
  });

  it('opens the tooltip of a noted term', async () => {
    openScope();
    await renderBlock();
    expect(screen.getByTestId('block')).toHaveTextContent(TEXT);

    await fireEvent.press(screen.getByText('stakeholder'), at(40, 300));
    expect(useVocabUiStore.getState().tooltip).toEqual({
      key: 'stakeholder',
      x: 40,
      y: 300,
      isNew: false,
    });
  });

  it('selects words by tapping and the sentence by long-pressing in note mode', async () => {
    openScope();
    setVocabNoteMode(true);
    await renderBlock();
    expect(screen.getByTestId('block')).toHaveTextContent(TEXT);

    await fireEvent.press(screen.getByText('plan'), at(1, 2));
    await fireEvent.press(screen.getByText('work'), at(3, 4));
    const selection = useVocabUiStore.getState().selection;
    expect(selection && TEXT.slice(selection.start, selection.end)).toBe('plan the work');

    await fireEvent(screen.getByText('every'), 'longPress', at(5, 6));
    const sentence = useVocabUiStore.getState().selection;
    expect(sentence && TEXT.slice(sentence.start, sentence.end)).toBe(
      'Engage every stakeholder early',
    );
  });
});
