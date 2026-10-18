import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton, Text } from '@/components/ui';

type AttemptTopBarProps = {
  title: string;
  subtitle?: string;
  /** Right side: the clock, the pause button… */
  accessory?: ReactNode;
};

/** Top bar of the test screens (Figma v2 "Attempt"): back, title over subtitle, accessory. */
export function AttemptTopBar({ title, subtitle, accessory }: AttemptTopBarProps) {
  const { t } = useTranslation();
  const { back, canGoBack } = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center gap-3 bg-background px-4 pb-2"
      style={{ paddingTop: insets.top + 8 }}
    >
      {canGoBack() ? (
        <IconButton icon="chevron-back" onPress={back} accessibilityLabel={t('common.back')} />
      ) : null}
      <View className="flex-1">
        <Text type="h6" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text type="body-xs" color="muted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {accessory}
    </View>
  );
}
