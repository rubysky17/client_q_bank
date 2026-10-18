import { useLocalSearchParams } from 'expo-router';

import { ExamDetailScreen } from '@/screens/exam-detail';

export default function ExamRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ExamDetailScreen id={id} />;
}
