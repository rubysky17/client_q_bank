import { useLocalSearchParams } from 'expo-router';

import { ReviewScreen } from '@/screens/review';

export default function ReviewRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReviewScreen id={id} />;
}
