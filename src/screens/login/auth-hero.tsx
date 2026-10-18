import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { GradientGlow, GradientView, LogoMark, Text } from '@/components/ui';

type AuthHeroProps = {
  title: string;
  subtitle: string;
};

/** Gradient header of the sign-in and sign-up screens: wordmark, title and subtitle. */
export function AuthHero({ title, subtitle }: AuthHeroProps) {
  const insets = useSafeAreaInsets();
  const onBrand = useCSSVariable('--color-on-brand');

  return (
    <GradientView className="gap-2 px-6 pb-14" style={{ paddingTop: insets.top + 40 }}>
      {/* Light icons on the gradient while this screen is shown. */}
      <StatusBar style="light" />
      <GradientGlow className="-top-16 -right-12 size-56" />
      <GradientGlow className="top-40 -left-12 size-36" />
      <Animated.View entering={FadeInDown.duration(500)} className="gap-2">
        <View className="flex-row items-center gap-2 pb-4">
          <View className="size-9 items-center justify-center rounded-[10px] bg-on-brand-subtle">
            <LogoMark size={26} color={typeof onBrand === 'string' ? onBrand : 'transparent'} />
          </View>
          <Text type="h5" className="font-bold text-on-brand">
            Q Bank
          </Text>
        </View>
        <Text type="h2" className="text-on-brand">
          {title}
        </Text>
        <Text className="text-on-brand-muted">{subtitle}</Text>
      </Animated.View>
    </GradientView>
  );
}
