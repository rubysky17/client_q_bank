import { useSettingsStore } from './settings-store';
import { storage } from './storage';

describe('settings store', () => {
  beforeEach(() => {
    useSettingsStore.getState().reset();
  });

  it('defaults to following the system theme and language', () => {
    const { theme, language } = useSettingsStore.getState();
    expect(theme).toBe('system');
    expect(language).toBe('system');
  });

  it('updates the theme', () => {
    useSettingsStore.getState().setTheme('dark');
    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('persists only data fields to MMKV, not actions', () => {
    useSettingsStore.getState().setLanguage('en');

    const persisted = JSON.parse(storage.getString('settings') ?? '{}');
    expect(persisted.state).toEqual({
      theme: 'system',
      language: 'en',
      dailyGoal: null,
      reminder: { enabled: false, hour: 20, minute: 0 },
    });
  });

  it('keeps the daily goal and the reminder', () => {
    useSettingsStore.getState().setDailyGoal(30);
    useSettingsStore.getState().setReminder({ enabled: true, hour: 7, minute: 0 });
    const { dailyGoal, reminder } = useSettingsStore.getState();
    expect(dailyGoal).toBe(30);
    expect(reminder).toEqual({ enabled: true, hour: 7, minute: 0 });
  });
});
