import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/** App-wide synchronous key-value storage. Not encrypted: keep secrets in expo-secure-store. */
export const storage = createMMKV({ id: 'q-bank' });

/** Adapter so zustand `persist` reads/writes MMKV synchronously (no hydration flash). */
export const zustandStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => {
    storage.remove(name);
  },
};
