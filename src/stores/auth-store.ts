import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const REFRESH_TOKEN_KEY = 'auth.refreshToken';

export type SessionTokens = { accessToken: string; refreshToken: string };

type AuthState = {
  /** In-memory copies of the tokens; the source of truth lives in the encrypted SecureStore. */
  accessToken: string | null;
  refreshToken: string | null;
  /** Saves a new token pair (sign-in and every refresh rotate both). */
  setTokens: (tokens: SessionTokens) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()((set) => ({
  // Synchronous reads so the first render already knows whether the user is signed in.
  accessToken: SecureStore.getItem(ACCESS_TOKEN_KEY),
  refreshToken: SecureStore.getItem(REFRESH_TOKEN_KEY),
  setTokens: async ({ accessToken, refreshToken }) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
    set({ accessToken, refreshToken });
  },
  signOut: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
    set({ accessToken: null, refreshToken: null });
  },
}));

export const useIsSignedIn = () => useAuthStore((s) => s.accessToken !== null);
