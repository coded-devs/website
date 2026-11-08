'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
} from 'react';
import { isCurrentPath, resolveNavHref } from '../lib/navigation';
import type { SiteNavigation as SiteNavigationContent } from '../types/site';
import { ButtonLink } from './button';
import styles from './site-navigation.module.css';

const DESKTOP_QUERY = '(min-width: 75rem)';

interface SiteNavigationProps {
  navigation: SiteNavigationContent;
}

export function SiteNavigation({ navigation }: SiteNavigationProps) {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const mobileRootRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While open: focus the first link, lock page scroll, close on Escape and
  // when the viewport grows to the desktop layout.
  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      }
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onViewportChange = () => {
      if (desktop.matches) close(false);
    };
    document.addEventListener('keydown', onKeyDown);
    desktop.addEventListener('change', onViewportChange);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      desktop.removeEventListener('change', onViewportChange);
    };
  }, [open, close]);

  // No focus trap: moving focus out of the toggle and menu closes the menu.
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (next && !mobileRootRef.current?.contains(next)) setOpen(false);
  };

  const items = navigation.items.map((item) => ({
    label: item.label,
    href: resolveNavHref(item.href, pathname),
    current: isCurrentPath(item.href, pathname),
  }));
  const action = navigation.action
    ? {
        ...navigation.action,
        href: resolveNavHref(navigation.action.href, pathname),
      }
    : undefined;

  return (
    <>
      <nav className={styles.desktopNav} aria-label="Main">
        <ul className={styles.desktopList}>
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={styles.navLink}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {action ? (
        <div className={styles.desktopAction}>
          <ButtonLink href={action.href} size="sm">
            {action.label}
          </ButtonLink>
        </div>
      ) : null}

      <div className={styles.mobileRoot} ref={mobileRootRef} onBlur={onBlur}>
        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Close' : 'Menu'}
          <span className="visually-hidden"> navigation</span>
        </button>

        <div id={menuId} className={styles.menu} hidden={!open} tabIndex={-1}>
          <nav aria-label="Main">
            <ul className={styles.menuList}>
              {items.map((item, index) => (
                <li key={item.href}>
                  <Link
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    className={styles.menuLink}
                    aria-current={item.current ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {action ? (
            <ButtonLink
              href={action.href}
              className={styles.menuAction}
              onClick={() => setOpen(false)}
            >
              {action.label}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </>
  );
}
