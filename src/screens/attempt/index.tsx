import { onlineManager } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { syncAttempt } from '@/api/attempt-sync';
import { type AttemptView, useAttempt } from '@/api/attempts';
import { ErrorView, LoadingView } from '@/components/ui';
import { hasLocalSession, sessionFromView } from '@/stores/attempt-sessions';

import { LegacyAttemptScreen } from './legacy-attempt';
import { SectionedAttemptScreen } from './sectioned';

/** How long opening waits for the server before going on with the device copy. */
const CHECK_TIMEOUT_MS = 4_000;

type AttemptScreenProps = {
  id: string;
};

/**
 * Sectioned attempts kept on the device open from it (offline too); anything else is read from the
 * server first.
 */
export function AttemptScreen({ id }: AttemptScreenProps) {
  const [isLocal] = useState(() => hasLocalSession(id));
  return isLocal ? <LocalAttempt id={id} /> : <RemoteAttempt id={id} />;
}

/**
 * Online, the device copy is uploaded first: if another device went on with the attempt, the
 * upload swaps in the server's copy (or drops it when closed there) before anything is shown.
 * Offline, or when the server is slow, the device copy opens as is.
 */
function LocalAttempt({ id }: AttemptScreenProps) {
  const [checked, setChecked] = useState(() => !onlineManager.isOnline());

  useEffect(() => {
    if (checked) return;
    let alive = true;
    const done = () => {
      if (alive) setChecked(true);
    };
    const timer = setTimeout(done, CHECK_TIMEOUT_MS);
    void syncAttempt(id).finally(() => {
      clearTimeout(timer);
      done();
    });
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, when the screen opens
  }, []);

  if (!checked) return <LoadingView />;
  return hasLocalSession(id) ? <SectionedAttemptScreen id={id} /> : <RemoteAttempt id={id} />;
}

function RemoteAttempt({ id }: AttemptScreenProps) {
  const { data: attempt, error, isPending, refetch } = useAttempt(id);

  if (isPending) return <LoadingView />;
  if (!attempt) return <ErrorView error={error} onRetry={refetch} />;
  if (attempt.mode === 'SECTIONED' && attempt.status === 'IN_PROGRESS') {
    return <TakeOver view={attempt} />;
  }
  return <LegacyAttemptScreen id={id} />;
}

/** First open on this device (new attempt, or one started elsewhere): keep it here from now on. */
function TakeOver({ view }: { view: AttemptView }) {
  useState(() => sessionFromView(view));
  return <SectionedAttemptScreen id={view.id} />;
}
