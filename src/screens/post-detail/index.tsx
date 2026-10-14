import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { usePost } from '@/api/posts';
import { Card, Chip, ErrorView, LoadingView, Text, useThemeColor } from '@/components/ui';
import { formatCompactNumber } from '@/utils/format-number';

type PostDetailScreenProps = {
  id: number;
};

export function PostDetailScreen({ id }: PostDetailScreenProps) {
  const { data: post, error, isPending, refetch } = usePost(id);
  const mutedColor = useThemeColor('muted');

  if (isPending) return <LoadingView />;
  if (!post) return <ErrorView error={error} onRetry={refetch} />;

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerClassName="gap-5 p-4">
      <Animated.View entering={FadeIn.duration(250)} className="gap-5">
        <Text type="h3">{post.title}</Text>

        <View className="flex-row flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Chip key={tag} size="sm" variant="soft" color="accent">
              <Chip.Label>#{tag}</Chip.Label>
            </Chip>
          ))}
        </View>

        <Text className="leading-6">{post.body}</Text>

        <Card className="flex-row justify-around">
          <Stat icon="eye-outline" value={post.views} color={mutedColor} />
          <Stat icon="thumbs-up-outline" value={post.reactions.likes} color={mutedColor} />
          <Stat icon="thumbs-down-outline" value={post.reactions.dislikes} color={mutedColor} />
        </Card>
      </Animated.View>
    </ScrollView>
  );
}

type StatProps = {
  icon: 'eye-outline' | 'thumbs-up-outline' | 'thumbs-down-outline';
  value: number;
  color: string;
};

function Stat({ icon, value, color }: StatProps) {
  return (
    <View className="items-center gap-1">
      <Ionicons name={icon} size={20} color={color} />
      <Text weight="semibold">{formatCompactNumber(value)}</Text>
    </View>
  );
}
