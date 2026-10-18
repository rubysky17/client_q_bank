import { useThemeColor } from 'heroui-native';
import { type ReactNode, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { useBrandColors } from './gradient-view';

type ProgressRingProps = {
  /** 0–100. */
  percent: number;
  size?: number;
  thickness?: number;
  /** `brand`: gradient arc on a neutral track. `on-brand`: white arc for gradient backgrounds. */
  variant?: 'brand' | 'on-brand';
  /** Shown in the middle, e.g. the percentage. */
  children?: ReactNode;
  accessibilityLabel?: string;
};

/** Circular progress starting at the top, clockwise, with rounded ends. */
export function ProgressRing({
  percent,
  size = 132,
  thickness = 12,
  variant = 'brand',
  children,
  accessibilityLabel,
}: ProgressRingProps) {
  const id = `ring${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [start, end] = useBrandColors();
  const neutralTrack = useThemeColor('surface-secondary');
  const [onBrand, onBrandTrack] = useCSSVariable(['--color-on-brand', '--color-on-brand-track']);
  const isOnBrand = variant === 'on-brand';
  const track = isOnBrand && typeof onBrandTrack === 'string' ? onBrandTrack : neutralTrack;
  const value = isOnBrand && typeof onBrand === 'string' ? onBrand : `url(#${id})`;

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const center = size / 2;

  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={start} />
            <Stop offset="1" stopColor={end} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={track}
          strokeWidth={thickness}
          fill="none"
        />
        {clamped > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={value}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${(circumference * clamped) / 100} ${circumference}`}
            transform={`rotate(-90 ${center} ${center})`}
            fill="none"
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}
