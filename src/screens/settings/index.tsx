import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLogout } from '@/api/auth';
import { Button, SegmentedControl, Text } from '@/components/ui';
import {
  type LanguagePreference,
  type ThemePreference,
  useSettingsStore,
} from '@/stores/settings-store';

import { AccountCard } from './account-card';

const THEMES = ['system', 'light', 'dark'] as const satisfies readonly ThemePreference[];
const LANGUAGES = ['system', 'vi', 'en'] as const satisfies readonly LanguagePreference[];

export function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // One selector per value: this screen re-renders only when these fields change.
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  return (
    <ScrollView
      contentContainerClassName="gap-6 px-4 pb-10"
      contentContainerStyle={{ paddingTop: insets.top + 12 }}
    >
      <Text type="h2">{t('settings.title')}</Text>

      <Section title={t('settings.account')}>
        <AccountCard />
      </Section>

      <Section title={t('settings.appearance')}>
        <SegmentedControl
          value={theme}
          onValueChange={setTheme}
          options={THEMES.map((value) => ({ value, label: t(`settings.theme.${value}`) }))}
        />
      </Section>

      <Section title={t('settings.language.label')}>
        <SegmentedControl
          value={language}
          onValueChange={setLanguage}
          options={LANGUAGES.map((value) => ({ value, label: t(`settings.language.${value}`) }))}
        />
      </Section>

      <Button variant="danger-soft" onPress={() => logout()} isDisabled={isLoggingOut}>
        <Button.Label>{t('settings.signOut')}</Button.Label>
      </Button>

      <Text type="body-xs" color="muted" align="center">
        {t('settings.version', { version: Constants.expoConfig?.version ?? '-' })}
      </Text>
    </ScrollView>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View className="gap-2">
      <Text type="body-sm" weight="medium" color="muted">
        {title}
      </Text>
      {children}
    </View>
  );
}
