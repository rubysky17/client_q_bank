import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { pendingUploadCount, syncAllAttemptsNow } from '@/api/attempt-sync';
import { useLogout, useLogoutAll, useMe } from '@/api/auth';
import { describeError } from '@/api/errors';
import { syncVocab } from '@/api/vocab-sync';
import { Button, SegmentedControl, Spinner, Switch, Text } from '@/components/ui';
import { env } from '@/lib/env';
import { areRemindersAvailable, cancelStudyReminder, scheduleStudyReminder } from '@/lib/reminders';
import { AttemptTopBar } from '@/screens/attempt/attempt-top-bar';
import { useLocalAttempts } from '@/stores/attempt-sessions';
import {
  DAILY_GOALS,
  type LanguagePreference,
  REMINDER_TIMES,
  type ReminderTime,
  type ThemePreference,
  useSettingsStore,
} from '@/stores/settings-store';
import { useSyncStatusStore } from '@/stores/sync-status-store';
import { usePendingVocabCount, useVocabStore } from '@/stores/vocab-store';

import { AccountCard } from './account-card';
import { ChoiceChips, SettingsGroup, SettingsRow } from './settings-rows';

const THEMES = ['system', 'light', 'dark'] as const satisfies readonly ThemePreference[];
const LANGUAGES = ['system', 'vi', 'en'] as const satisfies readonly LanguagePreference[];

/** Served by the API worker (back_q_bank/public/privacy.html). */
const PRIVACY_URL = `${new URL(env.EXPO_PUBLIC_API_URL).origin}/privacy`;
const SUPPORT_EMAIL = String(Constants.expoConfig?.extra?.supportEmail ?? '');

const pad = (n: number) => String(n).padStart(2, '0');
const clock = ({ hour, minute }: ReminderTime) => `${pad(hour)}:${pad(minute)}`;

/** Opened from Home (avatar or gear): a stack screen with a back button, no longer a tab. */
export function SettingsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { push } = useRouter();
  // One selector per value: this screen re-renders only when these fields change.
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const { data: me } = useMe();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const { mutate: logoutAll, isPending: isLoggingOutAll, error: logoutAllError } = useLogoutAll();

  const confirmLogoutAll = () =>
    Alert.alert(t('settings.logoutAllTitle'), t('settings.logoutAllMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.logoutAll'), style: 'destructive', onPress: () => logoutAll() },
    ]);

  return (
    <View className="flex-1">
      <AttemptTopBar title={t('settings.title')} />
      <ScrollView
        contentContainerClassName="gap-5 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <AccountCard />

        <SettingsGroup title={t('settings.account')}>
          <SettingsRow
            icon="person-circle-outline"
            tone="blue"
            title={t('settings.editProfile')}
            detail={me?.fullName}
            onPress={() => push('/profile')}
            hasDivider
          />
          <SettingsRow
            icon="lock-closed-outline"
            tone="violet"
            title={t('settings.changePassword')}
            detail={t('settings.changePasswordHint')}
            onPress={() => push('/change-password')}
          />
        </SettingsGroup>

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

        <StudyGroup />
        <SyncGroup />

        <SettingsGroup title={t('settings.security')}>
          <SettingsRow
            icon="phone-portrait-outline"
            tone="orange"
            title={t('settings.logoutAll')}
            detail={logoutAllError ? describeError(logoutAllError, t) : t('settings.logoutAllHint')}
            accessory={isLoggingOutAll ? <Spinner size="sm" /> : undefined}
            onPress={confirmLogoutAll}
            hasDivider
          />
          <SettingsRow
            icon="trash-outline"
            tone="pink"
            title={t('settings.deleteAccount')}
            detail={t('settings.deleteAccountHint')}
            onPress={() => push('/delete-account')}
            isDanger
          />
        </SettingsGroup>

        <SettingsGroup title={t('settings.about')}>
          {SUPPORT_EMAIL ? (
            <SettingsRow
              icon="mail-outline"
              tone="amber"
              title={t('settings.help')}
              detail={SUPPORT_EMAIL}
              onPress={() =>
                void Linking.openURL(
                  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('settings.helpSubject'))}`,
                )
              }
              hasDivider
            />
          ) : null}
          <SettingsRow
            icon="shield-checkmark-outline"
            tone="blue"
            title={t('settings.privacy')}
            onPress={() => void Linking.openURL(PRIVACY_URL)}
            hasDivider
          />
          <SettingsRow
            icon="information-circle-outline"
            tone="violet"
            title={t('settings.version', { version: Constants.expoConfig?.version ?? '-' })}
            detail={`Q Bank · ${Constants.expoConfig?.runtimeVersion ?? Constants.expoConfig?.version ?? ''}`}
          />
        </SettingsGroup>

        <Button variant="danger-soft" onPress={() => logout()} isDisabled={isLoggingOut}>
          <Button.Label>{t('settings.signOut')}</Button.Label>
        </Button>
      </ScrollView>
    </View>
  );
}

/** Daily goal (questions per day) and the daily reminder. */
function StudyGroup() {
  const { t } = useTranslation();
  const dailyGoal = useSettingsStore((s) => s.dailyGoal);
  const setDailyGoal = useSettingsStore((s) => s.setDailyGoal);
  const reminder = useSettingsStore((s) => s.reminder);
  const setReminder = useSettingsStore((s) => s.setReminder);
  const [isScheduling, setIsScheduling] = useState(false);
  const content = {
    title: t('reminder.title'),
    body: t('reminder.body'),
    channelName: t('reminder.channel'),
  };

  /** Turns the reminder on (asking for permission) or off, or moves it to another time. */
  const applyReminder = async (enabled: boolean, time: ReminderTime) => {
    setIsScheduling(true);
    try {
      if (!enabled) {
        await cancelStudyReminder();
        setReminder({ ...time, enabled: false });
        return;
      }
      const isScheduled = await scheduleStudyReminder(time, content);
      setReminder({ ...time, enabled: isScheduled });
      if (!isScheduled) {
        Alert.alert(t('reminder.deniedTitle'), t('reminder.deniedMessage'), [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('reminder.openSettings'), onPress: () => void Linking.openSettings() },
        ]);
      }
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <SettingsGroup title={t('settings.study')}>
      <SettingsRow
        icon="flag-outline"
        tone="orange"
        title={t('settings.dailyGoal')}
        detail={
          dailyGoal === null
            ? t('settings.dailyGoalOff')
            : t('settings.dailyGoalOn', { count: dailyGoal })
        }
        hasDivider
      >
        <ChoiceChips
          value={dailyGoal}
          onChange={setDailyGoal}
          options={[
            { value: null, label: t('settings.goalOff') },
            ...DAILY_GOALS.map((goal) => ({ value: goal, label: String(goal) })),
          ]}
        />
      </SettingsRow>
      <SettingsRow
        icon="notifications-outline"
        tone="blue"
        title={t('settings.reminder')}
        detail={
          !areRemindersAvailable
            ? t('settings.reminderUnavailable')
            : reminder.enabled
              ? t('settings.reminderOn', { time: clock(reminder) })
              : t('settings.reminderOff')
        }
        accessory={
          !areRemindersAvailable ? null : isScheduling ? (
            <Spinner size="sm" />
          ) : (
            <Switch
              isSelected={reminder.enabled}
              onSelectedChange={(enabled) => void applyReminder(enabled, reminder)}
              accessibilityLabel={t('settings.reminder')}
            />
          )
        }
      >
        <ChoiceChips
          value={clock(reminder)}
          isDisabled={!areRemindersAvailable || !reminder.enabled || isScheduling}
          onChange={(value) => {
            const time = REMINDER_TIMES.find((option) => clock(option) === value);
            if (time) void applyReminder(true, time);
          }}
          options={REMINDER_TIMES.map((time) => ({ value: clock(time), label: clock(time) }))}
        />
      </SettingsRow>
    </SettingsGroup>
  );
}

/**
 * What the device still has to send: sectioned attempts and vocabulary notes, and "sync now" for
 * both.
 */
function SyncGroup() {
  const { t, i18n } = useTranslation();
  // Re-renders after each upload (the device index changes).
  useLocalAttempts();
  const lastSyncedAt = useSyncStatusStore((s) => s.lastSyncedAt);
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'offline'>('idle');
  const pending = pendingUploadCount();
  const pendingVocab = usePendingVocabCount();
  const isSyncingVocab = useVocabStore((s) => s.syncing);

  const syncNow = async () => {
    setState('running');
    const [outcomes] = await Promise.all([syncAllAttemptsNow(), syncVocab()]);
    setState(outcomes.includes('OFFLINE') ? 'offline' : 'done');
  };

  const last =
    lastSyncedAt === null
      ? t('settings.neverSynced')
      : t('settings.lastSynced', {
          time: new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'short',
            timeStyle: 'short',
          }).format(new Date(lastSyncedAt)),
        });

  return (
    <SettingsGroup title={t('settings.sync')}>
      <SettingsRow
        icon={pending > 0 ? 'cloud-upload-outline' : 'cloud-done-outline'}
        tone={pending > 0 ? 'amber' : 'violet'}
        title={
          pending > 0 ? t('settings.pendingSync', { count: pending }) : t('settings.allSynced')
        }
        detail={
          state === 'offline'
            ? t('settings.syncOffline')
            : state === 'done'
              ? t('settings.syncDone')
              : last
        }
        accessory={
          <View>
            {state === 'running' ? (
              <Spinner size="sm" />
            ) : (
              <Button size="sm" variant="secondary" onPress={() => void syncNow()}>
                <Button.Label>{t('settings.syncNow')}</Button.Label>
              </Button>
            )}
          </View>
        }
        hasDivider
      />
      <SettingsRow
        icon={pendingVocab > 0 ? 'cloud-upload-outline' : 'book-outline'}
        tone={pendingVocab > 0 ? 'amber' : 'blue'}
        title={t('vocab.title')}
        detail={
          isSyncingVocab
            ? t('vocab.syncing')
            : pendingVocab > 0
              ? t('settings.vocabPending', { count: pendingVocab })
              : t('vocab.synced')
        }
      />
    </SettingsGroup>
  );
}

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <View className="gap-2">
      <Text type="body-xs" weight="semibold" color="muted" className="tracking-wide uppercase">
        {title}
      </Text>
      {children}
    </View>
  );
}
