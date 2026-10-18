import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ID = 'com.qbank.client';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Q Bank',
  slug: 'q-bank',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'qbank',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: APP_ID,
    icon: './assets/expo.icon',
  },
  android: {
    package: APP_ID,
    versionCode: 1,
    adaptiveIcon: {
      backgroundColor: '#0485F7',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        // Brand gradient start: the in-app splash (components/app-splash.tsx) continues from it.
        backgroundColor: '#0485F7',
        image: './assets/images/splash-icon.png',
        imageWidth: 112,
        dark: { backgroundColor: '#1F8FFF' },
      },
    ],
    'expo-localization',
    // Daily study reminders (local notifications only, no push).
    'expo-notifications',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: {
          // Build Expo modules from source: the precompiled XCFrameworks are tied to the Swift
          // version they were built with and fail on a newer Xcode.
          usePrecompiledModules: false,
        },
        android: {
          // arm64 covers real devices and Apple Silicon emulators; x86_64 covers Intel emulators.
          // Building 2 ABIs instead of 4 roughly halves native build time.
          buildArchs: ['arm64-v8a', 'x86_64'],
        },
      },
    ],
    './plugins/with-android-release-signing',
  ],
  extra: {
    /** Help & feedback in Settings opens a mail to this address; the row hides when empty. */
    supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL ?? '',
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
