import { useThemeColor } from 'heroui-native';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { labelIndexes, scaleLinear, toLinePath } from './geometry';

export type LineSeries = {
  key: string;
  color: string;
  /** One value per x position (index 0 = first). */
  values: readonly number[];
};

type LineChartProps = {
  series: readonly LineSeries[];
  height?: number;
  /** Top of the y axis; the axis starts at 0. */
  yMax?: number;
  formatY?: (value: number) => string;
  formatX?: (index: number) => string;
  /** What the chart says, for screen readers. */
  accessibilityLabel: string;
};

const PAD = { top: 16, right: 20, bottom: 22, left: 36 };
const Y_TICKS = [0, 0.5, 1];

/** Line chart over 0…yMax with recessive gridlines and the last value of each series labelled. */
export function LineChart({
  series,
  height = 180,
  yMax = 100,
  formatY = (value) => `${value}%`,
  formatX = (index) => String(index + 1),
  accessibilityLabel,
}: LineChartProps) {
  const [width, setWidth] = useState(0);
  const [grid, muted, surface] = useThemeColor(['separator', 'muted', 'surface']);

  const count = Math.max(0, ...series.map((s) => s.values.length));
  const x = scaleLinear([0, Math.max(count - 1, 0)], [PAD.left, width - PAD.right]);
  const y = scaleLinear([0, yMax], [height - PAD.bottom, PAD.top]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ height }}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <Svg width={width} height={height}>
          {Y_TICKS.map((tick) => {
            const value = Math.round(tick * yMax);
            return (
              <G key={tick}>
                <Line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(value)}
                  y2={y(value)}
                  stroke={grid}
                  strokeWidth={1}
                />
                <SvgText
                  x={PAD.left - 8}
                  y={y(value) + 4}
                  fontSize={11}
                  fill={muted}
                  textAnchor="end"
                >
                  {formatY(value)}
                </SvgText>
              </G>
            );
          })}
          {labelIndexes(count).map((index) => (
            <SvgText
              key={index}
              x={x(index)}
              y={height - 4}
              fontSize={11}
              fill={muted}
              textAnchor="middle"
            >
              {formatX(index)}
            </SvgText>
          ))}
          {series.map((s) => {
            const points = s.values.map((value, index) => ({ x: x(index), y: y(value) }));
            const last = points[points.length - 1];
            return (
              <G key={s.key}>
                {points.length > 1 ? (
                  <Path
                    d={toLinePath(points)}
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    fill="none"
                  />
                ) : null}
                {points.map((point, index) => (
                  <Circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill={s.color}
                    stroke={surface}
                    strokeWidth={1.5}
                  />
                ))}
                {last ? (
                  <SvgText
                    x={last.x}
                    y={last.y - 9}
                    fontSize={11}
                    fontWeight="600"
                    fill={muted}
                    textAnchor="middle"
                  >
                    {formatY(s.values[s.values.length - 1] ?? 0)}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </Svg>
      ) : null}
    </View>
  );
}
