import { useLocalSearchParams } from 'expo-router';

import { ReviewScreen } from '@/screens/review';
import { fromReviewParams } from '@/screens/review/review-filters';

export default function ReviewRoute() {
  const { id, ...params } = useLocalSearchParams<{ id: string }>();
  const { filters, questionId } = fromReviewParams(params);
  return <ReviewScreen id={id} initialFilters={filters} initialQuestionId={questionId} />;
}
