import { cn, useThemeColor } from 'heroui-native';
import { useId, useState } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

type Direction = 'diagonal' | 'horizontal' | 'vertical';

const VECTORS = {
  diagonal: { x1: '0', y1: '0', x2: '1', y2: '1' },
  horizontal: { x1: '0', y1: '0', x2: '1', y2: '0' },
  vertical: { x1: '0', y1: '0', x2: '0', y2: '1' },
} as const satisfies Record<Direction, object>;

/** The brand gradient stops (global.css `--brand-start` / `--brand-end`) for the current theme. */
export function useBrandColors(): [start: string, end: string] {
  const fallback = useThemeColor('accent');
  const [start, end] = useCSSVariable(['--color-brand-start', '--color-brand-end']);
  return [typeof start === 'string' ? start : fallback, typeof end === 'string' ? end : fallback];
}

type GradientViewProps = ViewProps & {
  direction?: Direction;
  className?: string;
};

/** A view painted with the brand gradient (blue → violet); children sit on top of it. */
export function GradientView({
  direction = 'diagonal',
  className,
  children,
  onLayout,
  ...rest
}: GradientViewProps) {
  // SVG ids can't contain the colons React puts in useId values.
  const id = `brand${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [start, end] = useBrandColors();
  // Measured: a percentage-sized Svg keeps its first layout size on iOS when the view grows.
  const [size, setSize] = useState({ width: 0, height: 0 });

  return (
    <View
      className={cn('overflow-hidden', className)}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
        onLayout?.(event);
      }}
      {...rest}
    >
      {size.width > 0 ? (
        <Svg style={StyleSheet.absoluteFill} width={size.width} height={size.height}>
          <Defs>
            <LinearGradient id={id} {...VECTORS[direction]}>
              <Stop offset="0" stopColor={start} />
              <Stop offset="1" stopColor={end} />
            </LinearGradient>
          </Defs>
          <Rect width={size.width} height={size.height} fill={`url(#${id})`} />
        </Svg>
      ) : null}
      {children}
    </View>
  );
}

/** Soft white circle behind gradient content; position and size it with `className`. */
export function GradientGlow({ className }: { className: string }) {
  return (
    <View
      pointerEvents="none"
      className={cn('absolute rounded-full bg-on-brand-faint', className)}
    />
  );
}
