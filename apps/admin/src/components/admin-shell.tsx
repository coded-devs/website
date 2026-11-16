'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ProtectedRoute } from './protected-route';
import { useAuth } from '../context/auth-context';

interface AdminShellProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Media Library', href: '/images', icon: 'media' },
  { label: 'Inquiries', href: '/inquiries', icon: 'inquiries' },
] as const;

function NavIcon({ name }: { name: (typeof navItems)[number]['icon'] }) {
  const common = {
    width: 19,
    height: 19,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  if (name === 'dashboard') {
    return (
      <svg {...common}>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
        <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    );
  }

  if (name === 'media') {
    return (
      <svg {...common}>
        <rect x="3.5" y="4" width="17" height="16" rx="2" />
        <circle cx="9" cy="9.5" r="1.5" />
        <path d="m5 17 4.5-4.5 3.2 3.2 2.3-2.3L19 18" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 6.5h16v11H4z" />
      <path d="m4.5 7 7.5 6 7.5-6" />
    </svg>
  );
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, logout, error } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!mobileNavOpen) return;
    sidebarRef.current?.querySelector<HTMLElement>('a[href]')?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
        menuToggleRef.current?.focus();
      }
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileNavOpen]);

  function handleSidebarKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab' || !mobileNavOpen || !sidebarRef.current) return;
    const focusable = Array.from(
      sidebarRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled)',
      ),
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
      router.replace('/login');
    } catch {
      // Keep the authenticated page and allow retry; the provider exposes a safe error.
    } finally {
      setSigningOut(false);
    }
  }

  const currentPage = navItems.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  )?.label;

  return (
    <ProtectedRoute>
      <div className="admin-shell">
        <a className="admin-skip-link" href="#admin-main">
          Skip to content
        </a>
        {mobileNavOpen && (
          <button
            type="button"
            className="admin-sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => {
              setMobileNavOpen(false);
              menuToggleRef.current?.focus();
            }}
          />
        )}
        <aside
          ref={sidebarRef}
          className={`admin-sidebar${mobileNavOpen ? ' is-open' : ''}`}
          aria-label="Admin sidebar"
          role={mobileNavOpen ? 'dialog' : 'complementary'}
          aria-modal={mobileNavOpen ? true : undefined}
          id="admin-sidebar"
          onKeyDown={handleSidebarKeyDown}
        >
          <Link
            href="/dashboard"
            className="admin-brand"
            aria-label="CodedDevs Admin home"
            onClick={() => setMobileNavOpen(false)}
          >
            <span className="admin-brand-name">
              <strong>CodedDevs</strong>
              <span>Admin CMS</span>
            </span>
          </Link>

          <nav className="admin-nav" aria-label="Admin Navigation">
            <span className="admin-nav-label">Workspace</span>
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' &&
                  pathname.startsWith(`${item.href}/`));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-nav-link${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setMobileNavOpen(false)}
                >
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="admin-sidebar-footer">
            {user && (
              <div className="admin-user">
                <span className="admin-user-avatar" aria-hidden="true">
                  {user.email.slice(0, 1).toUpperCase()}
                </span>
                <span className="admin-user-details">
                  <strong title={user.email}>{user.email}</strong>
                  <span>Super Admin</span>
                </span>
              </div>
            )}
            <button
              type="button"
              className="admin-logout"
              disabled={signingOut}
              onClick={handleLogout}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
              </svg>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </aside>

        <div className="admin-workspace">
          <header className="admin-topbar">
            <button
              className="admin-menu-toggle"
              type="button"
              aria-label={
                mobileNavOpen ? 'Close navigation' : 'Open navigation'
              }
              aria-controls="admin-sidebar"
              aria-expanded={mobileNavOpen}
              ref={menuToggleRef}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                {mobileNavOpen ? (
                  <path d="m6 6 12 12M18 6 6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>
            <div className="admin-breadcrumb" aria-label="Current page">
              <span>CodedDevs</span>
              <span aria-hidden="true">/</span>
              <strong>{currentPage ?? 'Admin'}</strong>
            </div>
          </header>
          <main className="admin-main" id="admin-main" tabIndex={-1}>
            <div className="admin-content">
              {error && (
                <div className="admin-feedback is-error" role="alert">
                  {error}
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
