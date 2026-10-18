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
        <NativeTabs.Trigger.Icon
          sf={{ default: 'doc.text', selected: 'doc.text.fill' }}
          md="description"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="bank">
        <NativeTabs.Trigger.Label>{t('tabs.bank')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'checklist', selected: 'checklist.checked' }}
          md="quiz"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="history">
        <NativeTabs.Trigger.Label>{t('tabs.history')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} md="history" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="reports">
        <NativeTabs.Trigger.Label>{t('tabs.reports')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
          md="bar_chart"
        />
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
