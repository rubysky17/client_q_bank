import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { GradientGlow, GradientView, LogoMark, Text } from '@/components/ui';

/** How long the brand screen stays after launch before fading into the app. */
const VISIBLE_MS = 900;

/**
 * Brand screen shown over the app at launch. The native splash (app.config.ts) has the gradient's
 * start color and the same mark, so this continues it, then fades out.
 */
export function AppSplash() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const onBrand = useCSSVariable('--color-on-brand');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <Animated.View
      exiting={FadeOut.duration(350)}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <GradientView className="flex-1 items-center justify-center gap-4">
        <GradientGlow className="-top-16 -left-28 size-80" />
        <GradientGlow className="-right-24 bottom-24 size-64" />
        <Animated.View
          entering={FadeIn.duration(300)}
          className="size-28 items-center justify-center rounded-[32px] border border-on-brand-subtle bg-on-brand-subtle"
        >
          <LogoMark size={88} color={typeof onBrand === 'string' ? onBrand : 'transparent'} />
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(120).duration(400)}
          className="items-center gap-1 px-10"
        >
          <Text type="h1" className="font-bold text-on-brand">
            Q Bank
          </Text>
          <Text className="text-center text-on-brand-muted">{t('splash.tagline')}</Text>
        </Animated.View>
        <View className="absolute bottom-12 flex-row gap-1.5">
          <View className="h-1.5 w-5 rounded-full bg-on-brand" />
          <View className="size-1.5 rounded-full bg-on-brand-track" />
          <View className="size-1.5 rounded-full bg-on-brand-track" />
        </View>
      </GradientView>
    </Animated.View>
  );
}
