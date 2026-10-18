import Ionicons from '@expo/vector-icons/Ionicons';
import { cn, PressableFeedback, Spinner, Text } from 'heroui-native';
import { useCSSVariable } from 'uniwind';

import { GradientView } from './gradient-view';
import type { IconName } from './icon-tile';

type GradientButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  /** Icon after the label instead of before it. */
  iconEnd?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
};

/** The main call to action of a screen, on the brand gradient (same size as HeroUI Button md). */
export function GradientButton({
  label,
  onPress,
  icon,
  iconEnd = false,
  isDisabled = false,
  isLoading = false,
  className,
}: GradientButtonProps) {
  const onBrand = useCSSVariable('--color-on-brand');
  const color = typeof onBrand === 'string' ? onBrand : undefined;
  const iconNode = icon ? <Ionicons name={icon} size={18} color={color} /> : null;

  return (
    <PressableFeedback
      onPress={onPress}
      isDisabled={isDisabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled || isLoading, busy: isLoading }}
      className={cn('rounded-3xl', isDisabled ? 'opacity-50' : undefined, className)}
    >
      <GradientView
        direction="horizontal"
        className="h-12 flex-row items-center justify-center gap-2 rounded-3xl px-4"
      >
        {isLoading ? <Spinner size="sm" color={color} /> : iconEnd ? null : iconNode}
        <Text weight="medium" className="text-on-brand" numberOfLines={1}>
          {label}
        </Text>
        {iconEnd && !isLoading ? iconNode : null}
      </GradientView>
    </PressableFeedback>
  );
}
