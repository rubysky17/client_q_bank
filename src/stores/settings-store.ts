import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './storage';

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

const initialState = {
  theme: 'system',
  language: 'system',
  dailyGoal: null,
  reminder: { enabled: false, hour: 20, minute: 0 },
} satisfies SettingsData;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDailyGoal: (dailyGoal) => set({ dailyGoal }),
      setReminder: (reminder) => set({ reminder }),
      reset: () => set(initialState),
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
      migrate: (persisted) => ({ ...initialState, ...(persisted as Partial<SettingsData>) }),
    },
  ),
);
