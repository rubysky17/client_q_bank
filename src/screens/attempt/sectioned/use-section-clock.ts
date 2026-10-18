import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { getSession, withSession } from '@/stores/attempt-sessions';

/** How often the clock is read (it is computed, not counted down, so this never drifts). */
const TICK_MS = 250;

/**
 * Keeps the section clock honest while the test screen is open:
 * - ticks: ends the section when time is up, checkpoints the clock every second;
 * - pauses (and saves) when the app leaves the foreground or the screen closes. Coming back does
 *   NOT resume by itself: the user taps "continue" on the pause screen.
 */
export function useSectionClockLifecycle(attemptId: string) {
  useEffect(() => {
    const timer = setInterval(() => withSession(attemptId, (s) => s.tick()), TICK_MS);
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') {
        withSession(attemptId, (s) => {
          s.pause();
          s.checkpoint();
        });
      }
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
      withSession(attemptId, (s) => {
        s.pause();
        s.checkpoint();
      });
    };
  }, [attemptId]);
}

/** Thresholds where the timer turns to a warning and the phone buzzes once. */
const WARN_AT_MS = [5 * 60_000, 60_000];

/** Time left in the running section, re-read 4 times a second (for the timer badge only). */
export function useRemainingMs(attemptId: string): number | null {
  const [remaining, setRemaining] = useState(() => getSession(attemptId)?.remainingMs() ?? null);
  const warned = useRef(new Set<number>());

  useEffect(() => {
    const timer = setInterval(() => {
      const next = getSession(attemptId)?.remainingMs() ?? null;
      setRemaining(next === null ? null : Math.ceil(next / 1000) * 1000);
      for (const at of WARN_AT_MS) {
        if (next !== null && next <= at && next > at - 2_000 && !warned.current.has(at)) {
          warned.current.add(at);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [attemptId]);

  return remaining;
}
