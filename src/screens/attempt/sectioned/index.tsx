import Ionicons from '@expo/vector-icons/Ionicons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { activeSection } from '@/attempt-engine/reducer';
import { IconButton, LoadingView, Text, useThemeColor } from '@/components/ui';
import { NoteModeHint, NoteToggle, VocabScope } from '@/components/vocab';
import {
  dispatchAttempt,
  getSession,
  loadSnapshot,
  useSessionState,
  withSession,
} from '@/stores/attempt-sessions';
import { formatClockMs } from '@/utils/format-duration';

import { AttemptTopBar } from '../attempt-top-bar';
import { BreakScreen } from './break-screen';
import { FinishScreen } from './finish-screen';
import { PauseOverlay } from './pause-overlay';
import { QuestionScreen } from './question-screen';
import { SectionIntro } from './section-intro';
import { SectionReview } from './section-review';
import { useRemainingMs, useSectionClockLifecycle } from './use-section-clock';

type SectionedAttemptScreenProps = {
  id: string;
};

/**
 * A sectioned attempt, played entirely on the device: [section → optional break] × n. Every action
 * is recorded as an event and uploaded in the background (see `src/api/attempt-sync.ts`).
 */
export function SectionedAttemptScreen({ id }: SectionedAttemptScreenProps) {
  const { t } = useTranslation();
  const [snapshot] = useState(() => {
    getSession(id);
    return loadSnapshot(id);
  });
  const state = useSessionState(id);
  useSectionClockLifecycle(id);

  const phase = state?.phase;
  // The last section ended (by the user or the clock): hand the attempt in.
  useEffect(() => {
    if (phase === 'FINISHED' && state?.closing === null) {
      dispatchAttempt(id, { type: 'ATTEMPT_SUBMIT' });
    }
  }, [id, phase, state?.closing]);

  // Handed in, or already uploaded and forgotten by the device (same element, so it stays mounted
  // while the session disappears): FinishScreen uploads it and navigates away.
  if (!state || !snapshot || state.closing !== null) {
    return <FinishScreen id={id} closing={state?.closing ?? 'SUBMIT'} />;
  }

  const working = state.phase === 'IN_SECTION' || state.phase === 'IN_REVIEW';
  const isRunning = getSession(id)?.isRunning ?? false;
  const section = activeSection(state);
  const sectionTitle = (order: number) =>
    snapshot.sections.find((s) => s.order === order)?.title ?? t('sectioned.section', { order });

  let body;
  if (state.phase === 'NOT_STARTED') {
    body = <SectionIntro state={state} sectionTitle={sectionTitle} />;
  } else if (state.phase === 'BREAK_OFFER' || state.phase === 'ON_BREAK') {
    body = <BreakScreen state={state} sectionTitle={sectionTitle} />;
  } else if (state.phase === 'IN_REVIEW') {
    body = <SectionReview state={state} snapshot={snapshot} sectionTitle={sectionTitle} />;
  } else if (state.phase === 'IN_SECTION') {
    body = <QuestionScreen state={state} snapshot={snapshot} />;
  } else {
    body = <LoadingView />;
  }

  return (
    <View className="flex-1">
      {/* The v2 top bar replaces the native header. */}
      <Stack.Screen options={{ headerShown: false }} />
      <AttemptTopBar
        title={working && section ? sectionTitle(section.order) : state.examTitle}
        subtitle={working ? state.examTitle : undefined}
        accessory={
          working ? (
            <View className="flex-row items-center gap-2">
              <NoteToggle />
              <HeaderClock
                attemptId={id}
                isRunning={isRunning}
                onPause={() => withSession(id, (s) => s.pause())}
              />
            </View>
          ) : null
        }
      />
      <NoteModeHint />
      {body}
      {/*
        Vocabulary notes while a question is on screen. Paused, it unmounts: note mode ends and the
        tooltip (drawn above everything, the pause cover included) closes. Not an attempt action:
        nothing goes through dispatchAttempt and the clock is untouched.
      */}
      {state.phase === 'IN_SECTION' && isRunning ? (
        <VocabScope sourceTitle={state.examTitle} resetKey={state.currentQuestionId} />
      ) : null}
      {working && !isRunning ? (
        <PauseOverlay
          attemptId={id}
          sectionTitle={section ? sectionTitle(section.order) : ''}
          onResume={() => withSession(id, (s) => s.resume())}
        />
      ) : null}
    </View>
  );
}

type HeaderClockProps = {
  attemptId: string;
  isRunning: boolean;
  onPause: () => void;
};

function HeaderClock({ attemptId, isRunning, onPause }: HeaderClockProps) {
  const { t } = useTranslation();
  const remaining = useRemainingMs(attemptId);
  const [warning, danger, foreground] = useThemeColor(['warning', 'danger', 'foreground']);
  const level =
    remaining !== null && remaining <= 60_000
      ? 'danger'
      : remaining !== null && remaining <= 5 * 60_000
        ? 'warning'
        : 'normal';
  const tone = level === 'danger' ? danger : level === 'warning' ? warning : foreground;
  // Literal class names so Tailwind generates them.
  const pill =
    level === 'danger'
      ? 'bg-danger-soft'
      : level === 'warning'
        ? 'bg-warning-soft'
        : 'bg-surface-secondary';

  return (
    <View className="flex-row items-center gap-2">
      <View className={`flex-row items-center gap-1.5 rounded-full px-3 py-2 ${pill}`}>
        <Ionicons name="timer-outline" size={16} color={tone} />
        <Text
          type="body-sm"
          weight="semibold"
          style={{ color: tone, fontVariant: ['tabular-nums'] }}
        >
          {formatClockMs(remaining) ?? ''}
        </Text>
      </View>
      {isRunning ? (
        <IconButton icon="pause" onPress={onPause} accessibilityLabel={t('sectioned.pause')} />
      ) : null}
    </View>
  );
}
