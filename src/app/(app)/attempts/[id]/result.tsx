import { useLocalSearchParams } from 'expo-router';

import { ResultScreen } from '@/screens/result';

export default function ResultRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ResultScreen id={id} />;
}
