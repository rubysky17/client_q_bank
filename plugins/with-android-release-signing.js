// @ts-check
const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @generated q-bank release signing';

/*
 * Adds a `release` signing config to android/app/build.gradle on every `expo prebuild`
 * (android/ is generated, so it can't be edited by hand).
 *
 * Reads these Gradle properties (put them in ~/.gradle/gradle.properties, never in the repo):
 *   QBANK_UPLOAD_STORE_FILE=/absolute/path/to/q-bank-upload.keystore
 *   QBANK_UPLOAD_STORE_PASSWORD=...
 *   QBANK_UPLOAD_KEY_ALIAS=q-bank-upload
 *   QBANK_UPLOAD_KEY_PASSWORD=...
 * If they are missing it falls back to the debug keystore, so `assembleRelease` always works
 * for local testing (such an APK is not suitable for the Play Store).
 * Create a keystore with `npm run keystore`.
 */
const RELEASE_SIGNING_CONFIG = `
        ${MARKER}
        release {
            if (findProperty('QBANK_UPLOAD_STORE_FILE')) {
                storeFile file(findProperty('QBANK_UPLOAD_STORE_FILE'))
                storePassword findProperty('QBANK_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('QBANK_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('QBANK_UPLOAD_KEY_PASSWORD')
            } else {
                logger.warn('[q-bank] QBANK_UPLOAD_* not set: release build is signed with the DEBUG keystore.')
                storeFile file('debug.keystore')
                storePassword 'android'
                keyAlias 'androiddebugkey'
                keyPassword 'android'
            }
        }`;

/** @param {string} gradle */
function addReleaseSigning(gradle) {
  if (gradle.includes(MARKER)) return gradle;

  const withConfig = gradle.replace(
    /signingConfigs\s*\{/,
    (match) => match + RELEASE_SIGNING_CONFIG,
  );

  // Point buildTypes.release at the new config (the template signs release with debug).
  const releaseBuildType =
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
  const result = withConfig.replace(releaseBuildType, '$1signingConfig signingConfigs.release');

  if (result === withConfig || withConfig === gradle) {
    throw new Error(
      '[with-android-release-signing] android/app/build.gradle layout changed; update plugins/with-android-release-signing.js',
    );
  }
  return result;
}

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withAndroidReleaseSigning = (config) =>
  withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = addReleaseSigning(mod.modResults.contents);
    return mod;
  });

module.exports = withAndroidReleaseSigning;
