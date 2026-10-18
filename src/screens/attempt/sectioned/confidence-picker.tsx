import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Confidence } from '@/attempt-engine/types';
import { Chip, Text } from '@/components/ui';

const LEVELS: readonly Confidence[] = ['LOW', 'MEDIUM', 'HIGH'];

type ConfidencePickerProps = {
  value: Confidence | null;
  /** Tapping the chosen level again clears it (confidence is optional). */
  onChange: (level: Confidence | null) => void;
};

/** "How sure are you?": separates real knowledge from lucky guesses in the reports. */
export function ConfidencePicker({ value, onChange }: ConfidencePickerProps) {
  const { t } = useTranslation();

  return (
    <View className="gap-2">
      <Text type="body-sm" color="muted">
        {t('sectioned.confidenceQuestion')}
      </Text>
      <View className="flex-row gap-2">
        {LEVELS.map((level) => (
          <Chip
            key={level}
            size="md"
            variant={value === level ? 'primary' : 'soft'}
            color="accent"
            onPress={() => onChange(value === level ? null : level)}
            accessibilityRole="radio"
            accessibilityState={{ checked: value === level }}
          >
            <Chip.Label>{t(`confidence.${level}`)}</Chip.Label>
          </Chip>
        ))}
      </View>
    </View>
  );
}
