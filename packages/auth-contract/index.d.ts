export interface AdminUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN';
}
export interface LoginCredentials {
  email: string;
  password: string;
}
export interface LoginResponse {
  expiresAt: string;
}
export interface CurrentSessionResponse {
  admin: AdminUser;
  session: LoginResponse;
}
export const AUTH_CSRF_HEADER: 'X-CodedDevs-CSRF';
export const AUTH_CSRF_VALUE: '1';
export function sessionCookieName(environment: string | undefined): string;
export function isLoginResponse(value: unknown): value is LoginResponse;
export function isCurrentSessionResponse(
  value: unknown,
): value is CurrentSessionResponse;
