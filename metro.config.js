// @ts-check
const { getDefaultConfig } = require('expo/metro-config');
const { withRozenite } = require('@rozenite/metro');
const { withUniwindConfig } = require('uniwind/metro');

/**
 * Rozenite (DevTools plugins) only activates with `WITH_ROZENITE=true` (`npm run devtools`).
 * Uniwind must stay the outermost wrapper.
 * @returns {Promise<import('expo/metro-config').MetroConfig>}
 */
module.exports = async () => {
  const config = await withRozenite(getDefaultConfig(__dirname), {
    enabled: process.env.WITH_ROZENITE === 'true',
  })();

  return withUniwindConfig(config, {
    cssEntryFile: './global.css',
    dtsFile: './src/uniwind-types.d.ts',
  });
};
