import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import {
  type IconName,
  IconTile,
  PressableFeedback,
  Text,
  type Tone,
  useThemeColor,
} from '@/components/ui';

type SettingsGroupProps = {
  title: string;
  children: ReactNode;
};

/** Uppercase label over a bordered card of rows (Figma v2 Settings). */
export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <View className="gap-2">
      <Text type="body-xs" weight="semibold" color="muted" className="tracking-wide uppercase">
        {title}
      </Text>
      <View className="overflow-hidden rounded-3xl border border-border bg-surface">
        {children}
      </View>
    </View>
  );
}

type SettingsRowProps = {
  icon: IconName;
  tone: Tone;
  title: string;
  detail?: string | null;
  /** Right side: a switch, a value… A chevron is shown for pressable rows without one. */
  accessory?: ReactNode;
  onPress?: () => void;
  /** Red title (destructive actions). */
  isDanger?: boolean;
  /** Draws the hairline under the row (every row but the last). */
  hasDivider?: boolean;
  /** Extra content under the title row (chips, buttons). */
  children?: ReactNode;
};

export function SettingsRow({
  icon,
  tone,
  title,
  detail,
  accessory,
  onPress,
  isDanger = false,
  hasDivider = false,
  children,
}: SettingsRowProps) {
  const muted = useThemeColor('muted');
  const body = (
    <View className={`gap-3 px-4 py-3 ${hasDivider ? 'border-b border-border' : ''}`}>
      <View className="flex-row items-center gap-3">
        <IconTile tone={tone} icon={icon} size="sm" />
        <View className="min-w-0 flex-1">
          <Text
            type="body-sm"
            weight="semibold"
            className={isDanger ? 'text-danger' : undefined}
            numberOfLines={2}
          >
            {title}
          </Text>
          {detail ? (
            <Text type="body-xs" color="muted" numberOfLines={2}>
              {detail}
            </Text>
          ) : null}
        </View>
        {accessory ??
          (onPress ? <Ionicons name="chevron-forward" size={18} color={muted} /> : null)}
      </View>
      {children}
    </View>
  );

  return onPress ? (
    <PressableFeedback onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
      {body}
    </PressableFeedback>
  ) : (
    body
  );
}

type ChoiceChipsProps<T> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  isDisabled?: boolean;
};

/** Small single-choice chips under a row (goal sizes, reminder times). */
export function ChoiceChips<T>({
  options,
  value,
  onChange,
  isDisabled = false,
}: ChoiceChipsProps<T>) {
  return (
    <View className={`flex-row flex-wrap gap-2 pl-12 ${isDisabled ? 'opacity-40' : ''}`}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <PressableFeedback
            key={option.label}
            onPress={() => onChange(option.value)}
            isDisabled={isDisabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected, disabled: isDisabled }}
            className={`rounded-full px-3 py-1.5 ${isSelected ? 'bg-accent' : 'bg-surface-secondary'}`}
          >
            <Text
              type="body-xs"
              weight="semibold"
              className={isSelected ? 'text-accent-foreground' : 'text-default-foreground'}
            >
              {option.label}
            </Text>
          </PressableFeedback>
        );
      })}
    </View>
  );
}
