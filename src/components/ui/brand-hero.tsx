import Ionicons from '@expo/vector-icons/Ionicons';
import { cn, PressableFeedback, Text } from 'heroui-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCSSVariable } from 'uniwind';

import { GradientGlow, GradientView } from './gradient-view';

type BrandHeroProps = {
  /** Shows a back button; screens using the hero hide the native header. */
  onBack?: () => void;
  /** Next to the back button (e.g. the screen name). */
  title?: string;
  /** Right side of the top row (e.g. a topic chip). */
  accessory?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/** Gradient header that runs under the status bar, with rounded bottom corners. */
export function BrandHero({ onBack, title, accessory, children, className }: BrandHeroProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const onBrand = useCSSVariable('--color-on-brand');

  return (
    <GradientView
      className={cn('gap-3 rounded-b-[28px] px-5 pb-6', className)}
      style={{ paddingTop: insets.top + 8 }}
    >
      {/* Light icons on the gradient while this screen is shown. */}
      <StatusBar style="light" />
      <GradientGlow className="-top-10 -right-14 size-56" />
      {onBack || title || accessory ? (
        <View className="flex-row items-center gap-3">
          {onBack ? (
            <PressableFeedback
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              className="size-10 items-center justify-center rounded-full bg-on-brand-subtle"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={typeof onBrand === 'string' ? onBrand : undefined}
              />
            </PressableFeedback>
          ) : null}
          {title ? (
            <Text type="h5" className="flex-1 text-on-brand" numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View className="flex-1" />
          )}
          {accessory}
        </View>
      ) : null}
      {children}
    </GradientView>
  );
}
