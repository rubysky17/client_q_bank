import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';

import { scaleLinear, toLinePath } from '@/components/ui/charts/geometry';
import { GradientGlow, GradientView, Text } from '@/components/ui';

type ReportHeroProps = {
  avgCorrectPercent: number;
  /** % correct per attempt, oldest first. */
  values: readonly number[];
};

const SPARK_HEIGHT = 48;

/** Gradient card: average % correct, change since the first attempt and a sparkline. */
export function ReportHero({ avgCorrectPercent, values }: ReportHeroProps) {
  const { t } = useTranslation();
  const [width, setWidth] = useState(0);
  const [onBrand, onBrandFaint] = useCSSVariable(['--color-on-brand', '--color-on-brand-faint']);
  const line = typeof onBrand === 'string' ? onBrand : 'transparent';
  const fill = typeof onBrandFaint === 'string' ? onBrandFaint : 'transparent';
  const first = values[0];
  const last = values[values.length - 1];
  const delta =
    first !== undefined && last !== undefined && values.length > 1 ? last - first : null;

  const lo = Math.min(...values, 100);
  const hi = Math.max(...values, 0);
  const x = scaleLinear([0, Math.max(values.length - 1, 1)], [2, width - 2]);
  const y = scaleLinear([lo, hi], [SPARK_HEIGHT - 4, 4]);
  const points = values.map((value, index) => ({ x: x(index), y: y(value) }));
  const path = toLinePath(points);

  return (
    <GradientView className="gap-2 rounded-3xl p-5">
      <GradientGlow className="-top-20 -right-12 size-52" />
      <Text type="body-sm" weight="medium" className="text-on-brand-muted">
        {t('reports.avgCorrect')}
      </Text>
      <View className="flex-row items-center gap-3">
        <Text className="text-[44px] leading-[48px] font-bold text-on-brand">{`${avgCorrectPercent}%`}</Text>
        {delta === null ? null : (
          <View className="flex-row items-center gap-1 rounded-full bg-on-brand-subtle px-2 py-1">
            <Ionicons name={delta >= 0 ? 'trending-up' : 'trending-down'} size={14} color={line} />
            <Text type="body-xs" weight="semibold" className="text-on-brand">
              {t('reports.sinceFirst', { delta: `${delta >= 0 ? '+' : ''}${delta}` })}
            </Text>
          </View>
        )}
      </View>
      {values.length > 1 ? (
        <View
          style={{ height: SPARK_HEIGHT }}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
          {width > 0 ? (
            <Svg width={width} height={SPARK_HEIGHT}>
              <Path
                d={`${path} L${points[points.length - 1]!.x} ${SPARK_HEIGHT} L${points[0]!.x} ${SPARK_HEIGHT} Z`}
                fill={fill}
              />
              <Path
                d={path}
                fill="none"
                stroke={line}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          ) : null}
        </View>
      ) : null}
    </GradientView>
  );
}
