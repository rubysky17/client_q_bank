import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { Card, IconTile, PressableFeedback, Text, type Tone, useThemeColor } from '@/components/ui';

type BankRowProps = {
  index: number;
  tone: Tone;
  label: string;
  preview: string;
  domain: string | null;
  difficultyLabel: string;
  hasCaseStudy: boolean;
  hasMedia: boolean;
  onPress: (index: number) => void;
};

// List item: primitive props only.
export function BankRow({
  index,
  tone,
  label,
  preview,
  domain,
  difficultyLabel,
  hasCaseStudy,
  hasMedia,
  onPress,
}: BankRowProps) {
  const muted = useThemeColor('muted');

  return (
    <PressableFeedback onPress={() => onPress(index)} className="rounded-3xl">
      <Card className="gap-3 border border-border">
        <View className="flex-row items-center gap-3">
          <IconTile tone={tone} icon="help-circle-outline" size="sm" />
          <Text type="body-xs" color="muted" className="flex-1" numberOfLines={2}>
            {label}
          </Text>
          {hasCaseStudy ? <Ionicons name="document-text-outline" size={16} color={muted} /> : null}
          {hasMedia ? <Ionicons name="image-outline" size={16} color={muted} /> : null}
        </View>
        <Text className="leading-6" numberOfLines={3}>
          {preview}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {domain ? (
            <View className="rounded-full bg-accent-soft px-2 py-1">
              <Text type="body-xs" weight="medium" className="text-accent-soft-foreground">
                {domain}
              </Text>
            </View>
          ) : null}
          <View className="rounded-full bg-surface-secondary px-2 py-1">
            <Text type="body-xs" weight="medium">
              {difficultyLabel}
            </Text>
          </View>
        </View>
      </Card>
    </PressableFeedback>
  );
}
