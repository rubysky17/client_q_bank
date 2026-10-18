import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { Card, Chip, PressableFeedback, Text, useThemeColor } from '@/components/ui';

type BankRowProps = {
  index: number;
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
      <Card className="gap-2">
        <View className="flex-row items-center gap-2">
          <Text type="body-xs" color="muted" className="flex-1" numberOfLines={1}>
            {label}
          </Text>
          {hasCaseStudy ? <Ionicons name="document-text-outline" size={14} color={muted} /> : null}
          {hasMedia ? <Ionicons name="image-outline" size={14} color={muted} /> : null}
        </View>
        <Text className="leading-6" numberOfLines={3}>
          {preview}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {domain ? (
            <Chip size="sm" variant="soft" color="accent">
              <Chip.Label>{domain}</Chip.Label>
            </Chip>
          ) : null}
          <Chip size="sm" variant="soft">
            <Chip.Label>{difficultyLabel}</Chip.Label>
          </Chip>
        </View>
      </Card>
    </PressableFeedback>
  );
}
