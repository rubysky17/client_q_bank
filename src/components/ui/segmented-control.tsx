import { Tabs } from 'heroui-native';

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  value: T;
  options: readonly Option<T>[];
  onValueChange: (value: T) => void;
};

/** Typed wrapper over HeroUI Tabs: the indicator slides on the UI thread (Reanimated). */
export function SegmentedControl<T extends string>({
  value,
  options,
  onValueChange,
}: SegmentedControlProps<T>) {
  const handleChange = (next: string) => {
    const option = options.find((o) => o.value === next);
    if (option) onValueChange(option.value);
  };

  return (
    <Tabs value={value} onValueChange={handleChange}>
      <Tabs.List>
        <Tabs.Indicator />
        {options.map((option) => (
          <Tabs.Trigger key={option.value} value={option.value} className="flex-1">
            <Tabs.Label>{option.label}</Tabs.Label>
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs>
  );
}
