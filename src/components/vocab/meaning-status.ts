import type { VocabSyncIssue } from '@/stores/vocab-store';
import type { VocabEntry } from '@/vocab/merge';

/**
 * What to show for a note's meaning: the meaning, or why there is none yet (being translated,
 * waiting for the network, waiting because the server or the translator did not answer, or the
 * server gave up and the user can retry or type one).
 */
export type MeaningStatus = 'ready' | 'translating' | 'offline' | 'waiting' | 'failed';

export function meaningStatus(
  entry: Pick<VocabEntry, 'meaning' | 'translateFailed'>,
  isOnline: boolean,
  syncIssue: VocabSyncIssue | null = null,
): MeaningStatus {
  if (entry.meaning !== null) return 'ready';
  if (entry.translateFailed) return 'failed';
  if (!isOnline) return 'offline';
  // Never spin forever: say it will come later when the last sync could not translate.
  return syncIssue === null ? 'translating' : 'waiting';
}
