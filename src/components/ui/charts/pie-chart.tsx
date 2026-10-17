import { useThemeColor } from 'heroui-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { donutSegments } from './geometry';

export type PieSlice = { key: string; value: number; color: string };

type PieChartProps = {
  slices: readonly PieSlice[];
  size?: number;
  thickness?: number;
  /** Shown in the hole, e.g. the main percentage. */
  children?: ReactNode;
  /** What the chart says, for screen readers. */
  accessibilityLabel: string;
};

/** Donut chart: one stroked circle per slice, starting at the top and going clockwise. */
export function PieChart({
  slices,
  size = 160,
  thickness = 18,
  children,
  accessibilityLabel,
}: PieChartProps) {
  const trackColor = useThemeColor('surface-secondary');
  const center = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = donutSegments(
    slices.map((slice) => slice.value),
    circumference,
    Math.min(3, thickness / 4),
  );
  const isEmpty = segments.every((segment) => segment === null);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      className="items-center justify-center"
      style={{ width: size, height: size }}
    >
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {isEmpty ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={trackColor}
            strokeWidth={thickness}
            fill="none"
          />
        ) : null}
        <G transform={`rotate(-90 ${center} ${center})`}>
          {slices.map((slice, index) => {
            const segment = segments[index];
            if (!segment) return null;
            return (
              <Circle
                key={slice.key}
                cx={center}
                cy={center}
                r={radius}
                stroke={slice.color}
                strokeWidth={thickness}
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                // A negative offset moves the dash forward along the circle.
                strokeDashoffset={-segment.start}
                fill="none"
              />
            );
          })}
        </G>
      </Svg>
      {children}
    </View>
  );
}
