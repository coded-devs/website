export function safeAdminRedirect(value: string | null): string {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\r\n]/.test(value)
  )
    return '/dashboard';
  const url = new URL(value, 'https://admin.invalid');
  const roots = [
    '/dashboard',
    '/website-content',
    '/insights',
    '/settings',
    '/inquiries',
  ];
  return url.origin === 'https://admin.invalid' &&
    roots.some(
      (root) => url.pathname === root || url.pathname.startsWith(`${root}/`),
    )
    ? url.pathname + url.search
    : '/dashboard';
}
