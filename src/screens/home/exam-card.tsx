import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card, GradientView, IconTile, PressableFeedback, Text, type Tone } from '@/components/ui';

/** Only the first screenful animates in; recycled cells further down appear instantly. */
const ANIMATED_ITEMS = 8;

type ExamCardProps = {
  id: string;
  title: string;
  topic: string;
  tone: Tone;
  questionsLabel: string;
  durationLabel: string;
  passLabel: string | null;
  /** Average % correct over the user's attempts; null = not taken yet. */
  avgPercent: number | null;
  /** "Avg. correct" or "Not taken yet". */
  avgLabel: string;
  /** Below the pass mark the average is shown as a warning. */
  isBelowPass: boolean;
  index: number;
  iconColor: string;
  onPress: (id: string) => void;
};

// List item: primitive props only, no data fetching, no context reads.
export function ExamCard({
  id,
  title,
  topic,
  tone,
  questionsLabel,
  durationLabel,
  passLabel,
  avgPercent,
  avgLabel,
  isBelowPass,
  index,
  iconColor,
  onPress,
}: ExamCardProps) {
  return (
    <Animated.View
      entering={index < ANIMATED_ITEMS ? FadeInDown.delay(index * 60).springify() : undefined}
    >
      <PressableFeedback onPress={() => onPress(id)} className="rounded-3xl">
        <Card className="gap-3 border border-border">
          <View className="flex-row items-center gap-3">
            <IconTile tone={tone} icon="document-text-outline" />
            <View className="flex-1 gap-0.5">
              <Text
                type="body-xs"
                weight="semibold"
                color="muted"
                className="tracking-wide uppercase"
                numberOfLines={1}
              >
                {topic}
              </Text>
              <Text weight="semibold" numberOfLines={2}>
                {title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={iconColor} />
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Pill icon="help-circle-outline" label={questionsLabel} color={iconColor} />
            <Pill icon="time-outline" label={durationLabel} color={iconColor} />
            {passLabel ? <Pill icon="ribbon-outline" label={passLabel} color={iconColor} /> : null}
          </View>
          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text type="body-xs" color="muted">
                {avgLabel}
              </Text>
              {avgPercent === null ? null : (
                <Text
                  type="body-xs"
                  weight="semibold"
                  className={
                    isBelowPass ? 'text-warning-soft-foreground' : 'text-success-soft-foreground'
                  }
                >
                  {`${avgPercent}%`}
                </Text>
              )}
            </View>
            {avgPercent === null ? null : (
              <View className="h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                <GradientView
                  direction="horizontal"
                  className="h-full rounded-full"
                  style={{ width: `${avgPercent}%` }}
                />
              </View>
            )}
          </View>
        </Card>
      </PressableFeedback>
    </Animated.View>
  );
}

type PillProps = {
  icon: 'help-circle-outline' | 'time-outline' | 'ribbon-outline';
  label: string;
  color: string;
};

function Pill({ icon, label, color }: PillProps) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-surface-secondary px-2 py-1">
      <Ionicons name={icon} size={14} color={color} />
      <Text type="body-xs" weight="medium">
        {label}
      </Text>
    </View>
  );
}
