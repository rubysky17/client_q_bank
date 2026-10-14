import { Uniwind } from 'uniwind';

import i18n, { resolveLanguage } from '@/i18n';
import { useSettingsStore } from '@/stores/settings-store';

type Settings = Pick<ReturnType<typeof useSettingsStore.getState>, 'theme' | 'language'>;

function apply({ theme, language }: Settings) {
  Uniwind.setTheme(theme);
  void i18n.changeLanguage(resolveLanguage(language));
}

/**
 * Pushes persisted settings into Uniwind (theme) and i18next (language).
 * MMKV hydration is synchronous, so the first frame already uses the saved values.
 */
export function startSettingsSync() {
  apply(useSettingsStore.getState());
  return useSettingsStore.subscribe((state, prev) => {
    if (state.theme !== prev.theme || state.language !== prev.language) apply(state);
  });
}
