import Link from 'next/link';
import type { ReactNode } from 'react';
import { isExternalHref } from '../lib/navigation';
import { ArrowUpRightIcon } from './icons';
import styles from './text-link.module.css';

interface TextLinkProps {
  href: string;
  children: ReactNode;
  /**
   * 'inline' links sit in running text and are always underlined.
   * 'standalone' links ("All insights") underline on hover only.
   */
  variant?: 'inline' | 'standalone';
  className?: string;
  'aria-current'?: 'page';
}

export function TextLink({
  href,
  children,
  variant = 'inline',
  className,
  'aria-current': ariaCurrent,
}: TextLinkProps) {
  const classes = [styles.link, styles[variant], className]
    .filter(Boolean)
    .join(' ');
  if (isExternalHref(href)) {
    return (
      <a href={href} className={classes}>
        {children}
        <ArrowUpRightIcon className={styles.icon} />
        <span className="visually-hidden"> (external site)</span>
      </a>
    );
  }
  // mailto: and tel: links are plain anchors.
  if (/^(mailto|tel):/i.test(href)) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} aria-current={ariaCurrent}>
      {children}
    </Link>
  );
}
