import { cn } from 'heroui-native';
import { View } from 'react-native';

export type BarSegment = {
  key: string;
  value: number;
  /** Background class, e.g. `bg-success`. */
  className: string;
};

type StackedBarProps = {
  segments: readonly BarSegment[];
  className?: string;
};

/** Horizontal bar split in proportion to the segment values (plain views, theme classes). */
export function StackedBar({ segments, className }: StackedBarProps) {
  return (
    <View
      className={cn(
        'h-2 flex-row gap-0.5 overflow-hidden rounded-full bg-surface-secondary',
        className,
      )}
    >
      {segments.map((segment) =>
        segment.value > 0 ? (
          <View key={segment.key} className={segment.className} style={{ flex: segment.value }} />
        ) : null,
      )}
    </View>
  );
}
