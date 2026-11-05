import type { ElementType, ReactNode } from 'react';
import styles from './container.module.css';

export type ContainerWidth = 'wide' | 'text' | 'narrow';

interface ContainerProps {
  children: ReactNode;
  width?: ContainerWidth;
  as?: ElementType;
  className?: string;
}

export function Container({
  children,
  width = 'wide',
  as: Component = 'div',
  className,
}: ContainerProps) {
  const classes = [styles.container, styles[width], className]
    .filter(Boolean)
    .join(' ');
  return <Component className={classes}>{children}</Component>;
}
