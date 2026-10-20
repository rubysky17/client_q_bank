import { type ReactNode, useEffect, useState } from 'react';

import { TermTooltip } from './term-tooltip';
import {
  createVocabScopeId,
  enterVocabScope,
  leaveVocabScope,
  resetVocabView,
} from './vocab-ui-store';

type VocabScopeProps = {
  /** Exam or practice the notes taken here come from. */
  sourceTitle: string;
  /** The question shown: when it changes, the selection and the tooltip go away. */
  resetKey?: string | null;
  children?: ReactNode;
};

/**
 * Turns the vocabulary layer on for the screen it is mounted in: noted terms are underlined and
 * note mode is available (`NoteToggle`). Elsewhere, question text renders exactly as before.
 * Also hosts the term tooltip of the screen. Unmounting it (leaving the screen, pausing the test)
 * ends note mode and closes the tooltip.
 */
export function VocabScope({ sourceTitle, resetKey = null, children }: VocabScopeProps) {
  const [scopeId] = useState(createVocabScopeId);

  useEffect(() => {
    enterVocabScope(scopeId, sourceTitle);
  }, [scopeId, sourceTitle]);

  useEffect(() => () => leaveVocabScope(scopeId), [scopeId]);

  useEffect(() => {
    resetVocabView();
  }, [resetKey]);

  return (
    <>
      {children}
      <TermTooltip />
    </>
  );
}
