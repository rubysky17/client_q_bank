import { cn } from 'heroui-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ActionBarProps = {
  children: ReactNode;
  /** `row`: buttons side by side (default). `column`: stacked. */
  direction?: 'row' | 'column';
  className?: string;
};

/** Bottom bar holding a screen's actions, above the home indicator. */
export function ActionBar({ children, direction = 'row', className }: ActionBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={cn(
        'gap-3 border-t border-border bg-background px-4 pt-3',
        direction === 'row' ? 'flex-row items-center' : undefined,
        className,
      )}
      style={{ paddingBottom: insets.bottom + 12 }}
    >
      {children}
    </View>
  );
}
