import Ionicons from '@expo/vector-icons/Ionicons';
import { cn, useThemeColor } from 'heroui-native';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/** One tone per chart series color (green and red stay reserved for correct and wrong). */
export const TONES = ['blue', 'orange', 'violet', 'amber', 'pink'] as const;
export type Tone = (typeof TONES)[number];

// Literal class names so Tailwind generates them.
const TONE_BACKGROUND = {
  blue: 'bg-chart-1-soft',
  orange: 'bg-chart-2-soft',
  violet: 'bg-chart-3-soft',
  amber: 'bg-chart-4-soft',
  pink: 'bg-chart-5-soft',
} as const satisfies Record<Tone, string>;

const TONE_VARIABLE = {
  blue: '--color-chart-1',
  orange: '--color-chart-2',
  violet: '--color-chart-3',
  amber: '--color-chart-4',
  pink: '--color-chart-5',
} as const satisfies Record<Tone, string>;

/** A stable tone for a key (topic, exam id…), so the same exam always gets the same color. */
export function toneFor(key: string): Tone {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return TONES[Math.abs(hash) % TONES.length]!;
}

const SIZES = {
  sm: { box: 'size-9 rounded-xl', icon: 18 },
  md: { box: 'size-11 rounded-2xl', icon: 22 },
} as const;

type IconTileProps = {
  icon: IconName;
  tone: Tone;
  size?: keyof typeof SIZES;
  className?: string;
};

/** Rounded square with a tinted background and the icon in the tone's color. */
export function IconTile({ icon, tone, size = 'md', className }: IconTileProps) {
  const fallback = useThemeColor('accent');
  const color = useCSSVariable(TONE_VARIABLE[tone]);
  const { box, icon: iconSize } = SIZES[size];

  return (
    <View className={cn('items-center justify-center', box, TONE_BACKGROUND[tone], className)}>
      <Ionicons name={icon} size={iconSize} color={typeof color === 'string' ? color : fallback} />
    </View>
  );
}
