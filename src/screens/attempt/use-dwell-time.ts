import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { type DwellState, pause, resume, startDwell, switchQuestion, take } from './dwell-tracker';

const isForeground = (status: AppStateStatus) => status !== 'background' && status !== 'inactive';

/**
 * Measures foreground time on the shown question. Returns `takeDwell()`, to call when the user picks
 * an answer: it gives the ms to send with that pick and restarts the count. Call it from event
 * handlers only (it reads a ref).
 */
export function useDwellTime(questionId: string | null) {
  const state = useRef<DwellState | null>(null);

  useEffect(() => {
    const now = Date.now();
    state.current = state.current
      ? switchQuestion(state.current, questionId, now)
      : startDwell(questionId, now, isForeground(AppState.currentState));
  }, [questionId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (!state.current) return;
      const now = Date.now();
      state.current = isForeground(status) ? resume(state.current, now) : pause(state.current, now);
    });
    return () => subscription.remove();
  }, []);

  return () => {
    if (!state.current) return undefined;
    const { ms, next } = take(state.current, Date.now());
    state.current = next;
    return ms;
  };
}
