import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const ACCESS_TOKEN_KEY = 'auth.accessToken';

type AuthState = {
  /** In-memory copy of the token; the source of truth lives in the encrypted SecureStore. */
  accessToken: string | null;
  signIn: (accessToken: string) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()((set) => ({
  // Synchronous read so the first render already knows whether the user is signed in.
  accessToken: SecureStore.getItem(ACCESS_TOKEN_KEY),
  signIn: async (accessToken) => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    set({ accessToken });
  },
  signOut: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    set({ accessToken: null });
  },
}));

export const useIsSignedIn = () => useAuthStore((s) => s.accessToken !== null);
