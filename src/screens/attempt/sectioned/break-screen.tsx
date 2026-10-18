import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isAnswered } from '@/attempt-engine/metrics';
import { sectionQuestionIds } from '@/attempt-engine/reducer';
import type { SessionState } from '@/attempt-engine/types';
import { Button, Card, Text, useThemeColor } from '@/components/ui';
import { dispatchAttempt } from '@/stores/attempt-sessions';
import { formatClockMs } from '@/utils/format-duration';

type BreakScreenProps = {
  state: SessionState;
  sectionTitle: (order: number) => string;
};

/**
 * Between two sections: offer the break (or skip it), count it down, then start the next section.
 * The break runs on the wall clock: it is rest, not test time. When it ends while the user is here,
 * the next section starts by itself; when the user was away, it waits for them to tap "start".
 */
export function BreakScreen({ state, sectionTitle }: BreakScreenProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const accent = useThemeColor('accent');
  const previous = state.sections.findLast((s) => s.status === 'COMPLETED');
  const next = state.sections.find((s) => s.status === 'LOCKED');
  if (!previous || !next) return null;

  const id = state.attemptId;
  const nextTitle = sectionTitle(next.order);
  const startNext = () => dispatchAttempt(id, { type: 'SECTION_START', sectionOrder: next.order });
  const canBreak =
    state.breakMinutes !== null && previous.breakTakenMs === null && !previous.breakSkipped;
  const done = sectionQuestionIds(state, previous.order);
  const answered = done.filter((qid) => isAnswered(state.questions[qid])).length;

  return (
    <View className="flex-1">
      <View className="flex-1 justify-center gap-6 p-6">
        <View className="items-center gap-2">
          <Ionicons
            name={state.phase === 'ON_BREAK' ? 'cafe-outline' : 'checkmark-circle-outline'}
            size={64}
            color={accent}
          />
          <Text type="h3" className="text-center">
            {state.phase === 'ON_BREAK'
              ? t('sectioned.onBreak')
              : t('sectioned.sectionDone', { title: sectionTitle(previous.order) })}
          </Text>
        </View>
        <Card className="gap-1">
          <Text type="body-sm" color="muted">
            {t('sectioned.doneSummary', {
              answered,
              total: done.length,
              time: formatClockMs(previous.usedMs) ?? '',
            })}
          </Text>
          {previous.endReason === 'TIME_UP' ? (
            <Text type="body-sm" className="text-warning">
              {t('sectioned.timeUp')}
            </Text>
          ) : null}
        </Card>
        {state.phase === 'ON_BREAK' ? (
          <BreakCountdown
            attemptId={id}
            // BREAK_START always sets it; ON_BREAK is never rebuilt from the server copy.
            startedAt={previous.breakStartedAt ?? 0}
            durationMs={(state.breakMinutes ?? 0) * 60_000}
            nextOrder={next.order}
          />
        ) : canBreak ? (
          <Text className="text-center leading-6">
            {t('sectioned.breakOffer', { count: state.breakMinutes ?? 0, title: nextTitle })}
          </Text>
        ) : (
          <Text className="text-center leading-6">
            {t('sectioned.nextReady', { title: nextTitle })}
          </Text>
        )}
      </View>
      <View
        className="gap-3 border-t border-separator bg-background px-4 pt-3"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        {state.phase === 'ON_BREAK' ? (
          <Button
            onPress={() => {
              dispatchAttempt(id, { type: 'BREAK_END' });
              startNext();
            }}
          >
            <Button.Label>{t('sectioned.endBreakNow', { title: nextTitle })}</Button.Label>
          </Button>
        ) : canBreak ? (
          <>
            <Button onPress={() => dispatchAttempt(id, { type: 'BREAK_START' })}>
              <Button.Label>
                {t('sectioned.takeBreak', { count: state.breakMinutes ?? 0 })}
              </Button.Label>
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                dispatchAttempt(id, { type: 'BREAK_SKIP' });
                startNext();
              }}
            >
              <Button.Label>{t('sectioned.skipBreak', { title: nextTitle })}</Button.Label>
            </Button>
          </>
        ) : (
          <Button onPress={startNext}>
            <Button.Label>{t('sectioned.startSection', { title: nextTitle })}</Button.Label>
          </Button>
        )}
      </View>
    </View>
  );
}

type BreakCountdownProps = {
  attemptId: string;
  startedAt: number;
  durationMs: number;
  nextOrder: number;
};

function BreakCountdown({ attemptId, startedAt, durationMs, nextOrder }: BreakCountdownProps) {
  const { t } = useTranslation();
  const leftAt = () => Math.max(0, durationMs - (Date.now() - startedAt));
  const [left, setLeft] = useState(leftAt);
  // Did the user see the break running? Only then may its end start the next section.
  const watched = useRef(left > 0 && AppState.currentState === 'active');

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, durationMs - (Date.now() - startedAt));
      setLeft(remaining);
      if (remaining > 0) {
        watched.current = AppState.currentState === 'active';
        return;
      }
      clearInterval(timer);
      dispatchAttempt(attemptId, { type: 'BREAK_END' });
      if (watched.current && AppState.currentState === 'active') {
        dispatchAttempt(attemptId, { type: 'SECTION_START', sectionOrder: nextOrder });
      }
    }, 500);
    // Timers may not run in the background: forget "watched" as soon as the app leaves.
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active') watched.current = false;
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [attemptId, startedAt, durationMs, nextOrder]);

  return (
    <View className="items-center gap-1">
      <Text type="body-sm" color="muted">
        {t('sectioned.breakLeft')}
      </Text>
      <Text type="h1" style={{ fontVariant: ['tabular-nums'] }}>
        {formatClockMs(left) ?? ''}
      </Text>
    </View>
  );
}
