import { View } from 'react-native';

import { PressableFeedback, Text } from '@/components/ui';
import { optionLetter } from '@/utils/format-duration';

type OptionItemProps = {
  id: string;
  index: number;
  content: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

// List item: primitive props only.
export function OptionItem({ id, index, content, isSelected, onSelect }: OptionItemProps) {
  return (
    <PressableFeedback
      onPress={() => onSelect(id)}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      className={`flex-row items-center gap-3 rounded-2xl border-2 p-4 ${
        isSelected ? 'border-accent bg-accent-soft' : 'border-border bg-surface'
      }`}
    >
      <View
        className={`size-8 items-center justify-center rounded-full ${
          isSelected ? 'bg-accent' : 'bg-surface-secondary'
        }`}
      >
        <Text
          weight="semibold"
          className={isSelected ? 'text-accent-foreground' : 'text-foreground'}
        >
          {optionLetter(index)}
        </Text>
      </View>
      <Text className="flex-1 leading-6">{content}</Text>
    </PressableFeedback>
  );
}
