import Ionicons from '@expo/vector-icons/Ionicons';
import { cn, PressableFeedback, useThemeColor } from 'heroui-native';

import type { IconName } from './icon-tile';

type IconButtonProps = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  isDisabled?: boolean;
  /** Toggle buttons: on (accent fill, `accessibilityState.selected`). */
  isSelected?: boolean;
  className?: string;
};

/** Round icon-only button on the surface color with a hairline border (v2 top bars). */
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
  isDisabled = false,
  isSelected,
  className,
}: IconButtonProps) {
  const [foreground, accentForeground] = useThemeColor(['foreground', 'accent-foreground']);

  return (
    <PressableFeedback
      onPress={onPress}
      isDisabled={isDisabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled, selected: isSelected }}
      className={cn(
        'items-center justify-center rounded-full border',
        isSelected ? 'border-accent bg-accent' : 'border-border bg-surface',
        isDisabled ? 'opacity-40' : undefined,
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Ionicons
        name={icon}
        size={Math.round(size * 0.5)}
        color={isSelected ? accentForeground : foreground}
      />
    </PressableFeedback>
  );
}
