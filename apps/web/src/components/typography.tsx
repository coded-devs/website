import type { ElementType, ReactNode, Ref } from 'react';
import { Band } from './band';
import styles from './typography.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4;
export type HeadingSize = 'display' | 'h1' | 'h2' | 'h3' | 'h4';

interface HeadingProps {
  /** Semantic level. Keep one h1 per page and never skip a level. */
  level: HeadingLevel;
  /** Visual size. Defaults to the size that matches the level. */
  size?: HeadingSize;
  children: ReactNode;
  id?: string;
  className?: string;
  tabIndex?: number;
  ref?: Ref<HTMLHeadingElement>;
}

export function Heading({
  level,
  size,
  children,
  id,
  className,
  tabIndex,
  ref,
}: HeadingProps) {
  const Tag = `h${level}` as const;
  const visual: HeadingSize = size ?? (`h${level}` as HeadingSize);
  const classes = [styles.heading, styles[visual], className]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag id={id} className={classes} tabIndex={tabIndex} ref={ref}>
      {children}
    </Tag>
  );
}

export type TextVariant = 'lead' | 'body' | 'article' | 'small' | 'label';

interface TextProps {
  children: ReactNode;
  variant?: TextVariant;
  tone?: 'default' | 'muted';
  as?: ElementType;
  className?: string;
}

export function Text({
  children,
  variant = 'body',
  tone,
  as: Component = 'p',
  className,
}: TextProps) {
  // Lead and small text are muted by default, per docs/design.md 3.7.
  const resolvedTone =
    tone ?? (variant === 'lead' || variant === 'small' ? 'muted' : 'default');
  const classes = [
    styles.text,
    styles[variant],
    resolvedTone === 'muted' ? styles.muted : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Component className={classes}>{children}</Component>;
}

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

/** Band marker plus a short label, used above section headings. */
export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p className={[styles.eyebrow, className].filter(Boolean).join(' ')}>
      <Band />
      {children}
    </p>
  );
}
