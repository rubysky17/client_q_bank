import Ionicons from '@expo/vector-icons/Ionicons';
import { cn } from 'heroui-native';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { GradientView } from './gradient-view';
import type { IconName } from './icon-tile';

type FeatureIconProps = {
  icon: IconName;
  size?: number;
  className?: string;
};

/** Large icon on the brand gradient with a soft halo: the focal point of status screens. */
export function FeatureIcon({ icon, size = 88, className }: FeatureIconProps) {
  const onBrand = useCSSVariable('--color-on-brand');

  return (
    <View className={cn('items-center justify-center rounded-full bg-accent-soft p-3', className)}>
      <GradientView
        className="items-center justify-center rounded-full"
        style={{ width: size, height: size }}
      >
        <Ionicons
          name={icon}
          size={Math.round(size * 0.45)}
          color={typeof onBrand === 'string' ? onBrand : undefined}
        />
      </GradientView>
    </View>
  );
}
