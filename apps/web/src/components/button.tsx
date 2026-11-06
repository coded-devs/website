import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { isExternalHref } from '../lib/navigation';
import { ArrowRightIcon, ArrowUpRightIcon } from './icons';
import styles from './button.module.css';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'md' | 'sm';

interface SharedProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Full width on mobile, for forms and the mobile menu. */
  fullWidthOnMobile?: boolean;
  className?: string;
}

function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidthOnMobile,
  className,
}: Omit<SharedProps, 'children'>): string {
  return [
    styles.button,
    styles[variant],
    styles[size],
    fullWidthOnMobile ? styles.fullWidthOnMobile : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

interface ButtonProps
  extends
    SharedProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {
  /** Shows the loading state: label swaps to loadingLabel and presses are ignored. */
  loading?: boolean;
  /** Progress verb shown while loading, for example "Sending". */
  loadingLabel?: string;
}

/** A button performs an action. Use ButtonLink to navigate. */
export function Button({
  children,
  variant,
  size,
  fullWidthOnMobile,
  className,
  loading = false,
  loadingLabel,
  type = 'button',
  disabled,
  onClick,
  ...rest
}: ButtonProps) {
  // While loading, the button keeps focus but cannot act: no handler, and it
  // cannot submit a form. No handler is created here, so this stays usable
  // from server components.
  return (
    <button
      {...rest}
      type={loading ? 'button' : type}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? undefined : onClick}
      className={buttonClasses({ variant, size, fullWidthOnMobile, className })}
    >
      {loading ? (
        <>
          <span className={styles.spinner} aria-hidden="true" />
          {loadingLabel ?? children}
        </>
      ) : (
        children
      )}
    </button>
  );
}

interface ButtonLinkProps extends SharedProps {
  href: string;
  /** Only usable from client components, for example to close a menu. */
  onClick?: () => void;
  /** Adds the arrow in its own circle, flush with the right edge. */
  withArrow?: boolean;
}

/** A link styled as a button. Links are never disabled. */
export function ButtonLink({
  children,
  href,
  variant,
  size,
  fullWidthOnMobile,
  className,
  onClick,
  withArrow,
}: ButtonLinkProps) {
  const external = isExternalHref(href);
  const classes = buttonClasses({
    variant,
    size,
    fullWidthOnMobile,
    className: [withArrow ? styles.withArrow : undefined, className]
      .filter(Boolean)
      .join(' '),
  });
  const arrow = withArrow ? (
    <span className={styles.arrow} aria-hidden="true">
      {external ? <ArrowUpRightIcon /> : <ArrowRightIcon size={14} />}
    </span>
  ) : external ? (
    <ArrowUpRightIcon />
  ) : null;
  if (external) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {children}
        {arrow}
        <span className="visually-hidden"> (external site)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={classes} onClick={onClick}>
      {children}
      {arrow}
    </Link>
  );
}
