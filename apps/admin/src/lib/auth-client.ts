import {
  AUTH_CSRF_HEADER,
  AUTH_CSRF_VALUE,
  isLoginResponse,
  isCurrentSessionResponse,
  type AdminUser,
  type LoginCredentials,
} from '@codeddevs/auth-contract';

export class AuthError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

async function request(path: string, options: RequestInit): Promise<Response> {
  try {
    return await fetch(`/api/v1/admin/auth/${path}`, {
      ...options,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    throw new AuthError(
      'Unable to contact authentication service. Please try again.',
      0,
    );
  }
}

async function json(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new AuthError('Invalid authentication response', 502);
  }
}

export async function login(credentials: LoginCredentials): Promise<AdminUser> {
  const response = await request('login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
    },
    body: JSON.stringify(credentials),
  });
  if (!response.ok)
    throw new AuthError(
      response.status === 401
        ? 'Invalid email or password'
        : 'Unable to sign in. Please try again.',
      response.status,
    );
  const data = await json(response);
  if (!isLoginResponse(data))
    throw new AuthError('Invalid authentication response', 502);
  const user = await getCurrentUser();
  if (!user)
    throw new AuthError(
      'Session verification failed. Please sign in again.',
      401,
    );
  return user;
}

export async function logout(): Promise<void> {
  const response = await request('logout', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      [AUTH_CSRF_HEADER]: AUTH_CSRF_VALUE,
    },
  });
  if (response.status !== 204)
    throw new AuthError(
      'Sign out could not be confirmed. Please try again.',
      response.status,
    );
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const response = await request('me', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (response.status === 401) return null;
  if (!response.ok)
    throw new AuthError(
      'Session verification is unavailable. Please try again.',
      response.status,
    );
  const data = await json(response);
  if (!isCurrentSessionResponse(data))
    throw new AuthError('Invalid authentication response', 502);
  return data.admin;
}
