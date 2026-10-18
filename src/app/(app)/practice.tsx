import { useLocalSearchParams } from 'expo-router';

import { fromParams } from '@/screens/bank/filters';
import { PracticeScreen } from '@/screens/practice';

export default function PracticeRoute() {
  const { filters, start } = fromParams(useLocalSearchParams());
  // New filters or start (e.g. a deep link onto an open screen) start a fresh session.
  return (
    <PracticeScreen key={JSON.stringify({ filters, start })} filters={filters} start={start} />
  );
}
