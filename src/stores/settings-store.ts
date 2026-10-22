import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './storage';
import { setUserItem } from './user-state-store';

export type ThemePreference = 'system' | 'light' | 'dark';
export type LanguagePreference = 'system' | 'vi' | 'en';

/** Questions to answer per day; null = no goal. */
export const DAILY_GOALS = [10, 20, 30, 50] as const;
export type DailyGoal = (typeof DAILY_GOALS)[number] | null;

/** Preset reminder times (local), so no time-picker dependency is needed. */
export const REMINDER_TIMES = [
  { hour: 7, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 21, minute: 30 },
] as const;
export type ReminderTime = { hour: number; minute: number };
export type Reminder = ReminderTime & { enabled: boolean };

/**
 * Settings kept per device (`theme`) and per account (the rest): account settings are also saved
 * as SETTING items of the signed-in user (`stores/user-state-store.ts`) and so follow them to every
 * device; `sync/account-settings.ts` brings the synced values back here. The persisted copy is what
 * the device shows while signed out.
 */
export const ACCOUNT_SETTINGS = ['language', 'dailyGoal', 'reminder'] as const;
export type AccountSetting = (typeof ACCOUNT_SETTINGS)[number];

type SettingsData = {
  /** 'system' = follow the OS. */
  theme: ThemePreference;
  /** 'system' = follow the device locale (falls back to Vietnamese). */
  language: LanguagePreference;
  dailyGoal: DailyGoal;
  /** Daily study reminder (local notification, see src/lib/reminders.ts). */
  reminder: Reminder;
};

type SettingsState = SettingsData & {
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: LanguagePreference) => void;
  setDailyGoal: (dailyGoal: DailyGoal) => void;
  setReminder: (reminder: Reminder) => void;
  reset: () => void;
};

export const initialSettings = {
  theme: 'system',
  language: 'system',
  dailyGoal: null,
  reminder: { enabled: false, hour: 20, minute: 0 },
} satisfies SettingsData;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialSettings,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => {
        set({ language });
        setUserItem('SETTING', 'language', language);
      },
      setDailyGoal: (dailyGoal) => {
        set({ dailyGoal });
        setUserItem('SETTING', 'dailyGoal', dailyGoal);
      },
      setReminder: (reminder) => {
        set({ reminder });
        setUserItem('SETTING', 'reminder', reminder);
      },
      reset: () => set(initialSettings),
    }),
    {
      name: 'settings',
      version: 2,
      storage: createJSONStorage(() => zustandStorage),
      partialize: ({ theme, language, dailyGoal, reminder }) => ({
        theme,
        language,
        dailyGoal,
        reminder,
      }),
      // v1 had only theme and language: the new fields start at their defaults.
      migrate: (persisted) => ({ ...initialSettings, ...(persisted as Partial<SettingsData>) }),
    },
  ),
);
