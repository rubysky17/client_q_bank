import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './storage';

export type ThemePreference = 'system' | 'light' | 'dark';
export type LanguagePreference = 'system' | 'vi' | 'en';

type SettingsState = {
  /** 'system' = follow the OS. */
  theme: ThemePreference;
  /** 'system' = follow the device locale (falls back to Vietnamese). */
  language: LanguagePreference;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: LanguagePreference) => void;
  reset: () => void;
};

const initialState = {
  theme: 'system',
  language: 'system',
} satisfies Pick<SettingsState, 'theme' | 'language'>;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      reset: () => set(initialState),
    }),
    {
      name: 'settings',
      version: 1,
      storage: createJSONStorage(() => zustandStorage),
      partialize: ({ theme, language }) => ({ theme, language }),
    },
  ),
);
