import { onlineManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

import { syncAllAttempts, syncAllAttemptsNow } from '@/api/attempt-sync';
import { activateLegacyOutboxUser, flushLegacyOutbox } from '@/api/legacy-outbox';
import { queryKeys } from '@/api/query-keys';
import { getSyncStatus, type SyncStatus } from '@/api/user-state';
import { syncUserState } from '@/api/user-state-sync';
import { syncVocab } from '@/api/vocab-sync';
import { createLogger } from '@/lib/logger';
import { queryClient } from '@/providers/query-client';
import { activateAttemptUser } from '@/stores/attempt-sessions';
import { useAuthStore } from '@/stores/auth-store';
import { activateSyncStatusUser } from '@/stores/sync-status-store';
import { activateUserStateUser, flushUserState } from '@/stores/user-state-store';
import { activateVocabUser, flushVocab } from '@/stores/vocab-store';
import { userIdFromToken } from '@/utils/jwt';

const log = createLogger('sync');

/** While the app is open and signed in, ask the server what other devices changed this often. */
const POLL_EVERY_MS = 20_000;
/** Logging out waits at most this long for the last uploads. */
const FLUSH_TIMEOUT_MS = 3_000;

let userId: string | null = null;
/** What the server said last time, for the signed-in user (null: ask, then sync everything). */
let known: SyncStatus | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Loads the data of the signed-in user everywhere it is kept on the device (attempts, vocabulary,
 * practice and settings, LEGACY answers waiting to be sent), or nobody's once signed out. The
 * previous user's data stays on the device under their own keys and is uploaded when they sign in
 * again.
 */
function activate(next: string | null) {
  if (next === userId) return;
  userId = next;
  known = null;
  activateSyncStatusUser(next);
  activateAttemptUser(next);
  activateVocabUser(next);
  activateUserStateUser(next);
  activateLegacyOutboxUser(next);
}

/** Uploads what the device holds and pulls what changed elsewhere, for every kind of data. */
function syncEverything() {
  if (!userId || !onlineManager.isOnline()) return;
  void syncUserState();
  void syncVocab();
  void flushLegacyOutbox();
  syncAllAttempts();
}

/**
 * One cheap request: what moved on the server since the last check. Only those parts sync, so an
 * idle app costs one request per poll.
 */
async function checkRemote() {
  if (!userId || !onlineManager.isOnline()) return;
  const asked = userId;
  let status: SyncStatus;
  try {
    status = await getSyncStatus();
  } catch (error) {
    log.warn('sync status failed', error);
    return;
  }
  if (asked !== userId) return;
  const previous = known;
  known = status;
  if (!previous) {
    syncEverything();
    return;
  }
  if (status.userStateRev !== previous.userStateRev) void syncUserState();
  if (status.vocabRev !== previous.vocabRev) void syncVocab();
  if (status.attemptsUpdatedAt !== previous.attemptsUpdatedAt) {
    // History, reports and the attempt open on screen; an attempt kept on the device learns on its
    // upload that another device went on with it (and reloads it).
    void queryClient.invalidateQueries({ queryKey: queryKeys.attempts.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.reports.all });
    void queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
    syncAllAttempts();
  }
}

function startPolling() {
  if (pollTimer) return;
  void checkRemote();
  pollTimer = setInterval(() => void checkRemote(), POLL_EVERY_MS);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

/**
 * Keeps every device of an account on the same data:
 * - each kind of data uploads shortly after the user acts (its own sync module);
 * - everything syncs when the user signs in, the app comes back to the foreground or the
 *   connection returns;
 * - while the app is open, `GET /me/sync-status` every 20 s tells what another device changed.
 * Started once by the app providers.
 */
export function startSync() {
  activate(userIdFromToken(useAuthStore.getState().accessToken));
  if (AppState.currentState === 'active') startPolling();

  const unsubscribeAuth = useAuthStore.subscribe((state, previous) => {
    if (state.accessToken === previous.accessToken) return;
    // Every token refresh changes the token, not the user.
    const next = userIdFromToken(state.accessToken);
    if (next === userId) return;
    activate(next);
    void checkRemote();
  });
  const unsubscribeOnline = onlineManager.subscribe((isOnline) => {
    if (isOnline) {
      known = null;
      void checkRemote();
    }
  });
  const appState = AppState.addEventListener('change', (status) => {
    if (status === 'active') {
      known = null;
      startPolling();
    } else {
      stopPolling();
      flushVocab();
      flushUserState();
    }
  });
  return () => {
    unsubscribeAuth();
    unsubscribeOnline();
    appState.remove();
    stopPolling();
  };
}

/**
 * Before signing out: saves to the device and tries to upload everything (at most 3 s). Whatever
 * could not be sent stays under the user's own keys until they sign in again.
 */
export async function flushBeforeSignOut() {
  flushVocab();
  flushUserState();
  if (!userId || !onlineManager.isOnline()) return;
  const uploads = Promise.allSettled([
    syncUserState(),
    syncVocab(),
    flushLegacyOutbox(),
    syncAllAttemptsNow(),
  ]);
  await Promise.race([uploads, new Promise((resolve) => setTimeout(resolve, FLUSH_TIMEOUT_MS))]);
}
