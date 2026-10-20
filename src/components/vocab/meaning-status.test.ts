import { meaningStatus } from './meaning-status';

describe('meaningStatus', () => {
  it('shows the meaning once there is one', () => {
    expect(meaningStatus({ meaning: 'bên liên quan', translateFailed: false }, false)).toBe(
      'ready',
    );
    expect(meaningStatus({ meaning: 'bên liên quan', translateFailed: true }, true)).toBe('ready');
  });

  it('tells why there is no meaning yet', () => {
    expect(meaningStatus({ meaning: null, translateFailed: true }, true)).toBe('failed');
    expect(meaningStatus({ meaning: null, translateFailed: true }, false)).toBe('failed');
    expect(meaningStatus({ meaning: null, translateFailed: false }, true)).toBe('translating');
    expect(meaningStatus({ meaning: null, translateFailed: false }, false)).toBe('offline');
  });

  it('stops promising a translation when the last sync could not translate', () => {
    const entry = { meaning: null, translateFailed: false };
    expect(meaningStatus(entry, true, 'server')).toBe('waiting');
    expect(meaningStatus(entry, true, 'translator')).toBe('waiting');
    expect(meaningStatus(entry, false, 'server')).toBe('offline');
    expect(meaningStatus({ meaning: 'mốc', translateFailed: false }, true, 'server')).toBe('ready');
  });
});
