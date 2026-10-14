type Level = 'debug' | 'info' | 'warn' | 'error';

/**
 * Scoped logger. `debug`/`info` are stripped in release builds; `warn`/`error` always print
 * (they show up in `adb logcat` under the ReactNativeJS tag).
 *
 * @example
 * const log = createLogger('api');
 * log.debug('GET /posts', { limit: 20 });
 */
export function createLogger(scope: string) {
  const write =
    (level: Level) =>
    (...args: unknown[]) => {
      if (!__DEV__ && (level === 'debug' || level === 'info')) return;
      console[level](`[${scope}]`, ...args);
    };

  return {
    debug: write('debug'),
    info: write('info'),
    warn: write('warn'),
    error: write('error'),
  };
}
