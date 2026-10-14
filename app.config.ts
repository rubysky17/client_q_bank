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
      backgroundColor: '#E6F4FE',
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
        backgroundColor: '#ffffff',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
        dark: { backgroundColor: '#000000' },
      },
    ],
    'expo-localization',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        android: {
          // arm64 covers real devices and Apple Silicon emulators; x86_64 covers Intel emulators.
          // Building 2 ABIs instead of 4 roughly halves native build time.
          buildArchs: ['arm64-v8a', 'x86_64'],
        },
      },
    ],
    './plugins/with-android-release-signing',
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
});
