'use client';

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from 'react';
import styles from './reveal.module.css';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  /** Delay in milliseconds, for staggering siblings. */
  delay?: number;
  className?: string;
}

/**
 * Fades and lifts its content in once it enters the viewport. Content is
 * always visible without JavaScript and under prefers-reduced-motion (the
 * hidden starting state only applies when html has the "js" class).
 */
export function Reveal({
  children,
  as: Component = 'div',
  delay = 0,
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            element.dataset.revealed = 'true';
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Component
      ref={ref}
      className={[styles.reveal, className].filter(Boolean).join(' ')}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Component>
  );
}
