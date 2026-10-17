import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card, Chip, PressableFeedback, Text } from '@/components/ui';

/** Only the first screenful animates in; recycled cells further down appear instantly. */
const ANIMATED_ITEMS = 8;

type ExamCardProps = {
  id: string;
  title: string;
  topic: string;
  questionsLabel: string;
  durationLabel: string;
  passLabel: string | null;
  index: number;
  iconColor: string;
  onPress: (id: string) => void;
};

// List item: primitive props only, no data fetching, no context reads.
export function ExamCard({
  id,
  title,
  topic,
  questionsLabel,
  durationLabel,
  passLabel,
  index,
  iconColor,
  onPress,
}: ExamCardProps) {
  return (
    <Animated.View
      entering={index < ANIMATED_ITEMS ? FadeInDown.delay(index * 60).springify() : undefined}
    >
      <PressableFeedback onPress={() => onPress(id)} className="rounded-3xl">
        <Card className="gap-3">
          <View className="flex-row">
            <Chip size="sm" variant="soft" color="accent">
              <Chip.Label>{topic}</Chip.Label>
            </Chip>
          </View>
          <Card.Title numberOfLines={2}>{title}</Card.Title>
          <View className="flex-row flex-wrap gap-4">
            <Stat icon="help-circle-outline" label={questionsLabel} color={iconColor} />
            <Stat icon="time-outline" label={durationLabel} color={iconColor} />
            {passLabel ? <Stat icon="ribbon-outline" label={passLabel} color={iconColor} /> : null}
          </View>
        </Card>
      </PressableFeedback>
    </Animated.View>
  );
}

type StatProps = {
  icon: 'help-circle-outline' | 'time-outline' | 'ribbon-outline';
  label: string;
  color: string;
};

function Stat({ icon, label, color }: StatProps) {
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={14} color={color} />
      <Text type="body-xs" color="muted">
        {label}
      </Text>
    </View>
  );
}
