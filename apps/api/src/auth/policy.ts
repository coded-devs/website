import {
  AUTH_CSRF_HEADER,
  AUTH_CSRF_VALUE,
  sessionCookieName,
} from '@codeddevs/auth-contract';

export const PASSWORD_MAXIMUM_UTF8_BYTES = 256;

export const PASSWORD_POLICY = {
  minimumLength: 8,
  maximumLength: 128,
  maximumUtf8Bytes: PASSWORD_MAXIMUM_UTF8_BYTES,
} as const;

export const SESSION_POLICY = {
  idleTimeoutMilliseconds: 30 * 60 * 1_000,
  absoluteTimeoutMilliseconds: 8 * 60 * 60 * 1_000,
  lastUsedUpdateIntervalMilliseconds: 5 * 60 * 1_000,
} as const;

export const LOGIN_POLICY = {
  bodyLimit: '16kb',
  csrfHeader: AUTH_CSRF_HEADER,
  csrfValue: AUTH_CSRF_VALUE,
  windowSeconds: 15 * 60,
  accountFailureThreshold: 5,
  ipFailureThreshold: 20,
  maximumBlockSeconds: 15 * 60,
} as const;

type RuntimeEnvironment = 'development' | 'test' | 'production';

export function getSessionCookiePolicy(environment: RuntimeEnvironment) {
  const isProduction = environment === 'production';

  return {
    name: sessionCookieName(environment),
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_POLICY.absoluteTimeoutMilliseconds,
  };
}
