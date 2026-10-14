import { useLocalSearchParams } from 'expo-router';

import { PostDetailScreen } from '@/screens/post-detail';

export default function PostRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PostDetailScreen id={Number(id)} />;
}
