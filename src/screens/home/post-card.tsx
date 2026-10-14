import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card, PressableFeedback, Text } from '@/components/ui';
import { formatCompactNumber } from '@/utils/format-number';

/** Only the first screenful animates in; recycled cells further down appear instantly. */
const ANIMATED_ITEMS = 8;

type PostCardProps = {
  id: number;
  title: string;
  body: string;
  views: number;
  likes: number;
  index: number;
  iconColor: string;
  onPress: (id: number) => void;
};

// List item: primitive props only, no data fetching, no context reads.
export function PostCard({
  id,
  title,
  body,
  views,
  likes,
  index,
  iconColor,
  onPress,
}: PostCardProps) {
  return (
    <Animated.View
      entering={index < ANIMATED_ITEMS ? FadeInDown.delay(index * 60).springify() : undefined}
    >
      <PressableFeedback onPress={() => onPress(id)} className="rounded-3xl">
        <Card className="gap-2">
          <Card.Title numberOfLines={2}>{title}</Card.Title>
          <Card.Description numberOfLines={2}>{body}</Card.Description>
          <View className="flex-row gap-4 pt-1">
            <Stat icon="eye-outline" value={views} color={iconColor} />
            <Stat icon="heart-outline" value={likes} color={iconColor} />
          </View>
        </Card>
      </PressableFeedback>
    </Animated.View>
  );
}

type StatProps = {
  icon: 'eye-outline' | 'heart-outline';
  value: number;
  color: string;
};

function Stat({ icon, value, color }: StatProps) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={14} color={color} />
      <Text type="body-xs" color="muted">
        {formatCompactNumber(value)}
      </Text>
    </View>
  );
}
