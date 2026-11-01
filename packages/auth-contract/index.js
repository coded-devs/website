export const AUTH_CSRF_HEADER = 'X-CodedDevs-CSRF';
export const AUTH_CSRF_VALUE = '1';
export function sessionCookieName(environment) {
  return environment === 'production'
    ? '__Host-codeddevs-admin-session'
    : 'codeddevs-admin-session';
}
const object = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
export function isLoginResponse(value) {
  return (
    object(value) &&
    Object.keys(value).length === 1 &&
    typeof value.expiresAt === 'string' &&
    Number.isFinite(Date.parse(value.expiresAt))
  );
}
export function isCurrentSessionResponse(value) {
  return (
    object(value) &&
    Object.keys(value).length === 2 &&
    object(value.admin) &&
    Object.keys(value.admin).length === 3 &&
    typeof value.admin.id === 'string' &&
    value.admin.id.length > 0 &&
    typeof value.admin.email === 'string' &&
    value.admin.email.length > 0 &&
    value.admin.role === 'SUPER_ADMIN' &&
    isLoginResponse(value.session)
  );
}
