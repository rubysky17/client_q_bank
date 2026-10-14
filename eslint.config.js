// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*', 'src/uniwind-types.d.ts'],
  },
  {
    rules: {
      // `{count && <Text/>}` renders "0" outside <Text> and crashes on native.
      'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary', 'coerce'] }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'import/no-duplicates': 'error',
    },
  },
  {
    files: ['src/lib/logger.ts', '**/*.config.js', 'scripts/**', 'plugins/**'],
    rules: { 'no-console': 'off' },
  },
]);
