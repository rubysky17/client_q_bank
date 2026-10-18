import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Confidence } from '@/attempt-engine/types';
import { PressableFeedback, Text } from '@/components/ui';

const LEVELS: readonly Confidence[] = ['LOW', 'MEDIUM', 'HIGH'];

// Literal class names so Tailwind generates them.
const SELECTED = {
  LOW: { bg: 'bg-warning-soft', fg: 'text-warning-soft-foreground' },
  MEDIUM: { bg: 'bg-accent-soft', fg: 'text-accent-soft-foreground' },
  HIGH: { bg: 'bg-success-soft', fg: 'text-success-soft-foreground' },
} as const satisfies Record<Confidence, { bg: string; fg: string }>;

type ConfidencePickerProps = {
  value: Confidence | null;
  /** Tapping the chosen level again clears it (confidence is optional). */
  onChange: (level: Confidence | null) => void;
};

/** "How sure are you?": separates real knowledge from lucky guesses in the reports. */
export function ConfidencePicker({ value, onChange }: ConfidencePickerProps) {
  const { t } = useTranslation();

  return (
    // Label on its own line: in Vietnamese it is too long to share a row with the chips.
    <View className="gap-2">
      <Text type="body-sm" weight="medium" color="muted">
        {t('sectioned.confidenceQuestion')}
      </Text>
      <View className="flex-row gap-2">
        {LEVELS.map((level) => {
          const isSelected = value === level;
          return (
            <PressableFeedback
              key={level}
              onPress={() => onChange(isSelected ? null : level)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              className={`h-10 flex-1 items-center justify-center rounded-full px-2 ${
                isSelected ? SELECTED[level].bg : 'bg-surface-secondary'
              }`}
            >
              <Text
                type="body-sm"
                weight="semibold"
                numberOfLines={1}
                className={isSelected ? SELECTED[level].fg : 'text-default-foreground'}
              >
                {t(`confidence.${level}`)}
              </Text>
            </PressableFeedback>
          );
        })}
      </View>
    </View>
  );
}
