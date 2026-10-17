import { cn, Text } from 'heroui-native';
import { View } from 'react-native';

export type LegendItem = {
  key: string;
  label: string;
  color: string;
  /** Shown at the end of the row, e.g. "7 · 58%". */
  value?: string;
};

type ChartLegendProps = {
  items: readonly LegendItem[];
  className?: string;
};

/** Color dot + label per series. Labels use the text color: color alone never identifies a series. */
export function ChartLegend({ items, className }: ChartLegendProps) {
  return (
    <View className={cn('gap-2', className)}>
      {items.map((item) => (
        <View key={item.key} className="flex-row items-center gap-2">
          <View className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          <Text type="body-sm" className="flex-1" numberOfLines={1}>
            {item.label}
          </Text>
          {item.value === undefined ? null : (
            <Text type="body-sm" color="muted">
              {item.value}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}
