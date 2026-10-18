import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, View } from 'react-native';

import { isAnswered } from '@/attempt-engine/metrics';
import { sectionQuestionIds } from '@/attempt-engine/reducer';
import type { SessionState } from '@/attempt-engine/types';
import {
  ActionBar,
  Button,
  Card,
  FeatureIcon,
  GradientButton,
  ProgressRing,
  Text,
} from '@/components/ui';
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
        <View className="items-center gap-3">
          <FeatureIcon icon={state.phase === 'ON_BREAK' ? 'cafe-outline' : 'checkmark-done'} />
          <Text type="h3" className="text-center">
            {state.phase === 'ON_BREAK'
              ? t('sectioned.onBreak')
              : t('sectioned.sectionDone', { title: sectionTitle(previous.order) })}
          </Text>
        </View>
        <Card className="flex-row items-center gap-4 border border-border">
          <ProgressRing
            percent={done.length > 0 ? Math.round((answered / done.length) * 100) : 0}
            size={56}
            thickness={6}
          >
            <Text type="body-xs" weight="semibold">{`${answered}/${done.length}`}</Text>
          </ProgressRing>
          <View className="flex-1 gap-0.5">
            <Text type="body-sm">
              {t('sectioned.doneSummary', {
                answered,
                total: done.length,
                time: formatClockMs(previous.usedMs) ?? '',
              })}
            </Text>
            {previous.endReason === 'TIME_UP' ? (
              <Text type="body-sm" className="text-warning-soft-foreground">
                {t('sectioned.timeUp')}
              </Text>
            ) : null}
          </View>
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
      <ActionBar direction="column">
        {state.phase === 'ON_BREAK' ? (
          <GradientButton
            icon="play"
            label={t('sectioned.endBreakNow', { title: nextTitle })}
            onPress={() => {
              dispatchAttempt(id, { type: 'BREAK_END' });
              startNext();
            }}
          />
        ) : canBreak ? (
          <>
            <GradientButton
              icon="cafe-outline"
              label={t('sectioned.takeBreak', { count: state.breakMinutes ?? 0 })}
              onPress={() => dispatchAttempt(id, { type: 'BREAK_START' })}
            />
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
          <GradientButton
            icon="play"
            label={t('sectioned.startSection', { title: nextTitle })}
            onPress={startNext}
          />
        )}
      </ActionBar>
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
      <Text type="h1" className="text-accent" style={{ fontVariant: ['tabular-nums'] }}>
        {formatClockMs(left) ?? ''}
      </Text>
    </View>
  );
}
