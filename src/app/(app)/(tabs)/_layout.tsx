import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';

import { useThemeColor } from '@/components/ui';

export default function TabsLayout() {
  const { t } = useTranslation();
  const [background, accent, accentSoft, muted] = useThemeColor([
    'background',
    'accent',
    'accent-soft',
    'muted',
  ]);

  return (
    <NativeTabs
      backgroundColor={background}
      indicatorColor={accentSoft}
      iconColor={{ default: muted, selected: accent }}
      labelStyle={{ default: { color: muted }, selected: { color: accent } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t('tabs.settings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
