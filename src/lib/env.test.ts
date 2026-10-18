describe('env', () => {
  const original = process.env.EXPO_PUBLIC_API_URL;

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = original;
    jest.resetModules();
  });

  it('always ends the API URL with a slash, so relative paths keep the /api/v1 prefix', () => {
    process.env.EXPO_PUBLIC_API_URL = 'http://10.0.2.2:8787/api/v1';
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- re-evaluate env.ts with the new value
    const { env } = require('./env') as typeof import('./env');
    expect(env.EXPO_PUBLIC_API_URL).toBe('http://10.0.2.2:8787/api/v1/');
    expect(new URL('auth/login', env.EXPO_PUBLIC_API_URL).href).toBe(
      'http://10.0.2.2:8787/api/v1/auth/login',
    );
  });
});
