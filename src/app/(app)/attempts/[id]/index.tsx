import { useLocalSearchParams } from 'expo-router';

import { AttemptScreen } from '@/screens/attempt';

export default function AttemptRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AttemptScreen id={id} />;
}
