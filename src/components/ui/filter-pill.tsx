import { cn, PressableFeedback, Text } from 'heroui-native';

type FilterPillProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  className?: string;
};

/** Filter chip of the v2 lists: inverted (foreground) when selected, outlined otherwise. */
export function FilterPill({ label, isSelected, onPress, className }: FilterPillProps) {
  return (
    <PressableFeedback
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      className={cn(
        'rounded-full border px-4 py-2',
        isSelected ? 'border-foreground bg-foreground' : 'border-border bg-surface',
        className,
      )}
    >
      <Text
        type="body-sm"
        weight="medium"
        className={isSelected ? 'text-background' : 'text-default-foreground'}
        numberOfLines={1}
      >
        {label}
      </Text>
    </PressableFeedback>
  );
}
