import { create } from 'zustand';

import { longPressWord, tapWord, type VocabSelection, type WordRange } from './selection';

export type { VocabSelection } from './selection';

type Point = { x: number; y: number };

/** The bubble with a noted term's meaning, at a window point (where the term was tapped). */
export type VocabTooltip = Point & {
  key: string;
  /** Opened right after saving the note: shows "Saved". */
  isNew: boolean;
};

type VocabUiState = {
  /** The screen showing questions (`VocabScope`): only there are notes underlined and taken. */
  scope: { id: number; sourceTitle: string } | null;
  /** Note mode: every word can be tapped to build a selection. */
  noteMode: boolean;
  selection: VocabSelection | null;
  tooltip: VocabTooltip | null;
  /** Last word tapped in note mode: the tooltip of a note just saved opens there. */
  lastTap: Point | null;
};

const IDLE = { noteMode: false, selection: null, tooltip: null, lastTap: null } as const;

/**
 * What the vocabulary layer shows on the screen being read (not persisted). A store rather than a
 * React context: the tooltip renders in a HeroUI `Portal` at the app root, outside any context.
 */
export const useVocabUiStore = create<VocabUiState>()(() => ({ scope: null, ...IDLE }));

// Scopes of the screens on the navigation stack, the top one last (a screen under the current one
// gets its scope back when the current one closes).
let scopes: { id: number; sourceTitle: string }[] = [];
let lastScopeId = 0;

export const createVocabScopeId = () => (lastScopeId += 1);

/** Starts (or renames) a scope; the newest one is the active one. */
export function enterVocabScope(id: number, sourceTitle: string) {
  const known = scopes.some((scope) => scope.id === id);
  scopes = known
    ? scopes.map((scope) => (scope.id === id ? { id, sourceTitle } : scope))
    : [...scopes, { id, sourceTitle }];
  const top = scopes[scopes.length - 1] ?? null;
  const current = useVocabUiStore.getState().scope;
  if (current?.id === top?.id && current?.sourceTitle === top?.sourceTitle) return;
  // A new screen on top starts without note mode or selection.
  useVocabUiStore.setState(current?.id === top?.id ? { scope: top } : { scope: top, ...IDLE });
}

/** Ends a scope: note mode, selection and tooltip go with it. */
export function leaveVocabScope(id: number) {
  const wasActive = useVocabUiStore.getState().scope?.id === id;
  scopes = scopes.filter((scope) => scope.id !== id);
  if (wasActive) useVocabUiStore.setState({ scope: scopes[scopes.length - 1] ?? null, ...IDLE });
}

export function setVocabNoteMode(noteMode: boolean) {
  useVocabUiStore.setState(
    noteMode ? { noteMode, tooltip: null } : { noteMode, selection: null, lastTap: null },
  );
}

export const toggleVocabNoteMode = () => setVocabNoteMode(!useVocabUiStore.getState().noteMode);

/** Note mode: a tap on a word of block `blockId` (whole text `text`) at window point `point`. */
export function pressVocabWord(blockId: string, text: string, word: WordRange, point: Point) {
  const { selection } = useVocabUiStore.getState();
  useVocabUiStore.setState({ selection: tapWord(selection, blockId, text, word), lastTap: point });
}

/** Note mode: a long press selects the sentence. */
export function longPressVocabWord(blockId: string, text: string, word: WordRange, point: Point) {
  useVocabUiStore.setState({ selection: longPressWord(blockId, text, word), lastTap: point });
}

export const clearVocabSelection = () => useVocabUiStore.setState({ selection: null });

export function openVocabTooltip(key: string, point: Point, isNew = false) {
  useVocabUiStore.setState({ tooltip: { key, x: point.x, y: point.y, isNew } });
}

export const closeVocabTooltip = () => useVocabUiStore.setState({ tooltip: null });

/** The text moved under the tooltip and the last tap: both are stale. */
export const dismissVocabOnScroll = () => {
  const { tooltip, lastTap } = useVocabUiStore.getState();
  if (tooltip || lastTap) useVocabUiStore.setState({ tooltip: null, lastTap: null });
};

/** Another question is shown: forget the selection and the tooltip. */
export const resetVocabView = () => {
  const { tooltip, selection, lastTap } = useVocabUiStore.getState();
  if (tooltip || selection || lastTap) {
    useVocabUiStore.setState({ tooltip: null, selection: null, lastTap: null });
  }
};

/** The selection was saved as note `key`: show its tooltip where the user last tapped. */
export function showSavedVocabNote(key: string, fallback: Point) {
  const { lastTap } = useVocabUiStore.getState();
  useVocabUiStore.setState({
    selection: null,
    tooltip: { key, ...(lastTap ?? fallback), isNew: true },
  });
}

export const useVocabScopeActive = () => useVocabUiStore((s) => s.scope !== null);
export const useVocabSourceTitle = () => useVocabUiStore((s) => s.scope?.sourceTitle ?? null);
export const useNoteMode = () => useVocabUiStore((s) => s.noteMode);
export const useVocabSelection = () => useVocabUiStore((s) => s.selection);
/** The selection when it is in block `blockId` (only that block re-renders as it changes). */
export const useBlockSelection = (blockId: string) =>
  useVocabUiStore((s) => (s.selection?.blockId === blockId ? s.selection : null));
export const useVocabTooltip = () => useVocabUiStore((s) => s.tooltip);
