/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  // ESM-only packages must be transpiled too (jest-expo's default list + ours).
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|ky|heroui-native|uniwind|zustand))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
