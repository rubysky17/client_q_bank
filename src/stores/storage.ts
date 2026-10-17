import { isRunningInExpoGo } from 'expo';
import type { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

type KeyValueStorage = Pick<MMKV, 'getString' | 'set' | 'remove'>;

export const MMKV_ID = 'q-bank';

/**
 * The MMKV instance, or `null` in Expo Go: it doesn't ship MMKV's native (Nitro) module, and even
 * importing `react-native-mmkv` there throws, hence the lazy `require`.
 */
export const mmkv: MMKV | null = isRunningInExpoGo()
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-require-imports -- must not load in Expo Go
    (require('react-native-mmkv') as typeof import('react-native-mmkv')).createMMKV({
      id: MMKV_ID,
    });

/**
 * App-wide synchronous key-value storage. Not encrypted: keep secrets in expo-secure-store.
 * In Expo Go it only lives in memory, so persisted state resets when the app restarts.
 */
export const storage: KeyValueStorage = mmkv ?? createMemoryStorage();

/** Adapter so zustand `persist` reads/writes MMKV synchronously (no hydration flash). */
export const zustandStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => {
    storage.remove(name);
  },
};

function createMemoryStorage(): KeyValueStorage {
  const values = new Map<string, unknown>();
  return {
    getString: (key) => {
      const value = values.get(key);
      return typeof value === 'string' ? value : undefined;
    },
    set: (key, value) => {
      values.set(key, value);
    },
    remove: (key) => values.delete(key),
  };
}
