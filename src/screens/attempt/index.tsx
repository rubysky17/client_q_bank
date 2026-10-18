import { useState } from 'react';

import { type AttemptView, useAttempt } from '@/api/attempts';
import { ErrorView, LoadingView } from '@/components/ui';
import { hasLocalSession, sessionFromView } from '@/stores/attempt-sessions';

import { LegacyAttemptScreen } from './legacy-attempt';
import { SectionedAttemptScreen } from './sectioned';

type AttemptScreenProps = {
  id: string;
};

/**
 * Sectioned attempts kept on the device open straight from it (offline too); anything else is read
 * from the server first.
 */
export function AttemptScreen({ id }: AttemptScreenProps) {
  const [isLocal] = useState(() => hasLocalSession(id));
  return isLocal ? <SectionedAttemptScreen id={id} /> : <RemoteAttempt id={id} />;
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
