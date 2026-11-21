'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FileText,
  Images,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react';
import { ProtectedRoute } from './protected-route';
import { useAuth } from '../context/auth-context';

interface AdminShellProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Articles', href: '/insights', icon: 'articles' },
  { label: 'Media Library', href: '/images', icon: 'media' },
  { label: 'Settings', href: '/settings', icon: 'settings' },
] as const;

function NavIcon({ name }: { name: (typeof navItems)[number]['icon'] }) {
  const icons = {
    dashboard: LayoutDashboard,
    articles: FileText,
    media: Images,
    settings: Settings,
  };
  const Icon = icons[name];
  return <Icon size={19} strokeWidth={1.7} aria-hidden="true" />;
}

export function AdminShell({ children }: AdminShellProps) {
  const { user, logout, error } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [sidebarPreferenceLoaded, setSidebarPreferenceLoaded] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const mobileDrawerOpen = isMobileViewport && mobileNavOpen;
  const closeMobileNavigation = useCallback(() => {
    if (isMobileViewport) menuToggleRef.current?.focus();
    setMobileNavOpen(false);
  }, [isMobileViewport]);

  useEffect(() => {
    const mobileViewport = window.matchMedia('(max-width: 700px)');
    function syncViewport() {
      setIsMobileViewport(mobileViewport.matches);
      if (!mobileViewport.matches) setMobileNavOpen(false);
    }
    syncViewport();
    mobileViewport.addEventListener('change', syncViewport);
    return () => mobileViewport.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    setIsSidebarCollapsed(
      window.localStorage.getItem('codeddevs-admin-sidebar-collapsed') ===
        'true',
    );
    setSidebarPreferenceLoaded(true);
  }, []);

  useEffect(() => {
    if (!sidebarPreferenceLoaded) return;
    window.localStorage.setItem(
      'codeddevs-admin-sidebar-collapsed',
      String(isSidebarCollapsed),
    );
  }, [isSidebarCollapsed, sidebarPreferenceLoaded]);

  useEffect(() => {
    if (!mobileDrawerOpen) return;
    sidebarRef.current?.querySelector<HTMLElement>('a[href]')?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMobileNavigation();
      }
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [closeMobileNavigation, mobileDrawerOpen]);

  function handleSidebarKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab' || !mobileDrawerOpen || !sidebarRef.current) return;
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
        {mobileDrawerOpen && (
          <button
            type="button"
            className="admin-sidebar-backdrop"
            aria-label="Close navigation"
            onClick={closeMobileNavigation}
          />
        )}
        <aside
          ref={sidebarRef}
          className={`admin-sidebar${mobileDrawerOpen ? ' is-open' : ''}${isSidebarCollapsed && !isMobileViewport ? ' is-collapsed' : ''}`}
          aria-label="Admin sidebar"
          role={mobileDrawerOpen ? 'dialog' : 'complementary'}
          aria-modal={mobileDrawerOpen ? true : undefined}
          inert={isMobileViewport && !mobileNavOpen}
          id="admin-sidebar"
          onKeyDown={handleSidebarKeyDown}
        >
          <Link
            href="/dashboard"
            className="admin-brand"
            aria-label="CodedDevs Admin home"
            onClick={closeMobileNavigation}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="admin-brand-mark"
              src="/assets/logos/codeddevs-mark.svg"
              alt=""
            />
            <span className="admin-brand-name">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="admin-brand-lockup"
                src="/assets/logos/codeddevs-lockup-horizontal.svg"
                alt=""
              />
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
                  aria-label={item.label}
                  title={item.label}
                  onClick={closeMobileNavigation}
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
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="admin-user-avatar"
                    src={user.avatarUrl}
                    alt=""
                  />
                ) : (
                  <span className="admin-user-avatar" aria-hidden="true">
                    {(user.firstName.trim().charAt(0) || 'A').toUpperCase()}
                  </span>
                )}
                <span className="admin-user-details">
                  <strong title={user.firstName || 'Super Admin'}>
                    {user.firstName || 'Admin'}
                  </strong>
                  <span>Super Admin</span>
                </span>
              </div>
            )}
            <button
              type="button"
              className="admin-logout"
              aria-label="Sign out"
              title="Sign out"
              disabled={signingOut}
              onClick={handleLogout}
            >
              <LogOut size={18} strokeWidth={1.7} aria-hidden="true" />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </aside>

        <div className="admin-workspace">
          <header className="admin-topbar">
            <button
              className="admin-sidebar-collapse-toggle"
              type="button"
              aria-label={
                isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
              aria-controls="admin-sidebar"
              aria-expanded={!isSidebarCollapsed}
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen size={20} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <PanelLeftClose
                  size={20}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              )}
            </button>
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
